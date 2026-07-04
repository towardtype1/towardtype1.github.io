---
title: "Post-training from scratch: a tutorial"
description: "How a base model becomes a math solver: SFT and GRPO explained from first principles, with the actual code and formulas from a laptop-scale project."
date: 2026-07-04
---

This is a walkthrough of a small project: teaching [Qwen2.5-0.5B](https://huggingface.co/Qwen/Qwen2.5-0.5B) to solve grade-school maths problems, on a MacBook, with every training loop written by hand.
The code lives at [github.com/towardtype1/grade-school-math](https://github.com/towardtype1/grade-school-math).

It is written as a tutorial.
By the end you should understand what every piece does and why it exists - including the two training runs that failed, because those taught the most.

## The picture

A language model fresh out of pretraining is not an assistant.
It has read a large fraction of the internet and learned one skill: given some text, predict the next token.
Post-training is the process of turning that raw predictor into something that answers questions.
We do it in two stages, and we measure before and after every stage:

<figure>
<pre>
 base model ──► [ SFT: imitate worked solutions ] ──► [ RL: reward correct answers ] ──► final
     │                      │                                    │
   eval                   eval                                 eval
  (0.000)                (0.330)                                (?)
</pre>
<figcaption>Fig. 1 - The pipeline. Same eval at every stage, so every improvement has a number.</figcaption>
</figure>

The repo mirrors this picture, one file per job:

```
gsm/
  data.py    - load the dataset, format prompts, extract answers
  eval.py    - measure accuracy of any checkpoint
  sft.py     - supervised fine-tuning loop
  grpo.py    - reinforcement learning loop
  report.py  - HTML report: curves, and sample answers evolving over training
```

## The data, and one very important regex

[GSM8K](https://huggingface.co/datasets/openai/gsm8k) is 8.5k word problems.
Every solution ends the same way:

```
Natalia sold 48/2 = 24 clips in May.
Natalia sold 48 + 24 = 72 clips altogether.
#### 72
```

That `#### 72` line is the whole reason this project works.
It means we can check an answer with a regex instead of a human:

```python
ANSWER_RE = re.compile(r"####[\s$*]*([-+]?[\d,]*\.?\d+)")

def extract_answer(text):
    m = ANSWER_RE.search(text)
    return normalize_number(m.group(1)) if m else None
```

One function, used in exactly two places: scoring evals, and computing RL rewards.
This is deliberate.
If eval and reward used different parsers, the model could look good on one and be trained on the other, and you would chase ghosts.

## Measuring: the eval harness

Evaluation is a loop: show the model a question, let it generate greedily (always pick the most likely next token, so results are repeatable), extract the answer, compare with the gold answer.

```python
prompt = f"Question: {question}\nAnswer:"
completion = generate(model, tokenizer, prompt)      # greedy decode
correct = extract_answer(completion) == gold_answer
```

We measure the untrained base model two ways, and the two numbers frame everything that follows:

- **Zero-shot: 0.000.** Just the question. The model actually reasons - it writes things like "The answer is 72" - but it never uses the `####` format, and it never stops: it invents a new question and keeps going. A document usually continues; the model continues it.
- **4-shot: 0.305.** Paste four solved examples above the question. Now "predict the next token" happens to mean "keep solving in this format", and the same weights get 30% right.

So the maths is largely already in the model.
What is missing is behaviour: answer the question you were asked, in a recognisable format, then stop.
That is what post-training installs.

## What a model outputs, and what a loss is

One paragraph of theory, because everything else builds on it.

For each position in the text, the model outputs a score for every token in its vocabulary (~152k of them).
Softmax turns those scores into probabilities.
The training loss for one position is **cross-entropy**:

```
loss = -log( p(the correct next token) )
```

Read it as: if the model gave the right token probability 1, the loss is 0; probability 0.01, the loss is 4.6.
Training nudges every weight to make the observed next token more probable - that is all "learning" means here, in both SFT and RL.

## Stage 1: SFT - learning by imitation

Supervised fine-tuning continues exactly this training, but only on text we want imitated: real GSM8K questions with their worked solutions.
The full loss function from `gsm/sft.py`:

```python
def loss_fn(model, tokens, mask):
    inputs, targets = tokens[:, :-1], tokens[:, 1:]   # position t predicts token t+1
    logits = model(inputs)
    ce = nn.losses.cross_entropy(logits, targets, reduction="none")
    m = mask[:, 1:]
    return (ce * m).sum() / mx.maximum(m.sum(), 1)
```

Three things are happening:

**The shift.** `inputs` is the text minus its last token, `targets` is the text minus its first.
Lining them up makes position t's prediction get scored against token t+1 - next-token prediction, mechanically.

**The mask.** `mask` is 0 over the question and 1 over the solution.
Multiplying the loss by it means the model is never trained to produce *questions* - the question is context, the solution is the target.
Forget this and you train a question generator.

**The average.** Dividing by the number of unmasked tokens makes batches of different lengths comparable.

The loop around it is: batch examples, compute gradients, AdamW optimizer step, warmup-then-cosine learning-rate schedule, save checkpoints.
About 140 lines, no magic.

### The sanity check that earns its keep

Before any long run: train on just 4 examples and demand the loss collapse to ~0 in minutes.
A loop that cannot memorise 4 examples is broken, and you want to know *now*.

Ours was broken.
Loss spiked from 1.18 to 16.3.
The code was fine - the problem was numerical.
MLX loads models in bfloat16, a 16-bit format with only 8 bits of precision, and the optimiser was keeping its internal statistics in the same format.
AdamW divides by the square root of a running average of *squared* gradients; at 8 bits of precision that division is noise.
Fix: convert the model to 32-bit floats for training, save checkpoints back as compact bfloat16 copies.

After 900 real steps (about an hour):

| Checkpoint | Zero-shot | 4-shot |
|---|---|---|
| base | 0.000 | 0.305 |
| + SFT | **0.330** | - |

The model now beats its own few-shot baseline with no examples in the prompt.
And SFT was cheap: one epoch, one laptop-hour.

But notice the ceiling built into the method.
SFT grades the model on *matching the reference text*, token by token.
A wrong answer written in perfect style scores the same as a right one.
To optimise being right, the training signal has to know what "right" means.

## Stage 2: RL - learning from consequences

Reinforcement learning flips the direction of learning.
Instead of showing the model what to write, we let it write, check whether it was right, and adjust.

The algorithm is [GRPO](https://arxiv.org/abs/2402.03300).
One training step, in words:

1. Take a question. Sample **a group of 8 answers** from the model at temperature 0.8 (temperature adds randomness, so the 8 answers differ).
2. Reward each answer: `1.0` if `extract_answer` matches gold, else `0.0`. Same parser as eval.
3. Convert rewards to **advantages** by normalising within the group.
4. Nudge the model: make high-advantage answers more probable, low-advantage answers less probable.

Step 3 is GRPO's clever bit, so let's do it by hand.
Say 1 of the 8 answers was correct: rewards `[1, 0, 0, 0, 0, 0, 0, 0]`.

```
mean = 0.125
std  = 0.33
advantage(correct) = (1 - 0.125) / 0.33 = +2.65
advantage(wrong)   = (0 - 0.125) / 0.33 = -0.38
```

The one success gets a strong push up; the failures get a mild push down.
"Better or worse *than the group*" replaces the separate value network that classic RL (PPO) trains just to estimate expectations - the group IS the expectation.
Note a built-in edge case: if all 8 answers are right, or all wrong, every advantage is exactly 0 and the step teaches nothing.
Remember that; it comes back to bite.

Step 4 is the policy-gradient loss, from `gsm/grpo.py`:

```python
def grpo_loss(model, tokens, mask, advantages):
    logp = -nn.losses.cross_entropy(logits, targets, reduction="none")
    per_seq = (logp * m).sum(axis=1) / m.sum(axis=1)   # avg log-prob of each answer
    return -(advantages * per_seq).mean()
```

Read the last line slowly.
`per_seq` is how probable the model finds each of its own sampled answers.
Multiplying by the advantage and minimising the negative means: **raise the probability of answers with positive advantage, lower it for negative ones.**
That is the entire mechanism of RL on language models.
Notice there is no reference answer anywhere - the model learns from its own attempts.

## Failure 1: the reward collapses

We ran exactly the loop above.
Within 16 steps the mean reward went from 0.18 to 0.00 and never recovered.

The logged samples showed why.
The answers stayed coherent - they just grew *longer* each step, until they ran past the token limit without ever writing `####`.
No `####`, no parse, no reward.

The mechanism is worth internalising.
With 1-in-8 correct, each step pushes down seven answers for every one it pushes up.
But all eight answers share their skeleton - the format, the reasoning style, the "finish and answer" move.
Pushing down seven wrong-but-well-formatted answers erodes that shared skeleton seven times as fast as the one success rebuilds it.
The model drifts toward never finishing: a perfect strategy for avoiding being wrong, and for never being right.

Then the edge case from earlier arrives: all 8 answers score 0, the group is uniform, all advantages are exactly 0, and the gradient is gone.
**A policy that never succeeds gets no signal to recover with.**
The run was not diverging; it was dead.

## The fix: a KL leash

Every production RL recipe includes a term that now makes visceral sense: a **KL divergence penalty** tying the trained policy to a frozen copy of its starting point (the SFT checkpoint).

The intuition: the reward only measures one thing (the final answer), but the policy carries a thousand behaviours the reward never mentions - formatting, stopping, staying on topic.
Unconstrained optimisation will happily sacrifice unmentioned behaviours to move the mentioned number.
The KL term prices that sacrifice: drift from the reference and pay a penalty, everywhere, not just where the reward looks.

The estimator, term by term:

```python
diff = ref_logp - logp                # how differently the frozen reference
                                      # and current policy rate these tokens
kl = exp(diff) - diff - 1             # ≥ 0; equals 0 only when diff = 0
loss = pg_loss + 0.1 * kl.mean()      # coefficient = the price of drift
```

Check it does what the intuition says: if the policy hasn't moved, `diff = 0` and the penalty is exactly 0 - staying put is free.
The further apart the two models rate the same tokens, the faster the penalty grows.

## Failure 2: noise, and the fix you can measure

The rerun with a small KL penalty kept the format alive (the leash worked) but the reward still decayed - this time the *arithmetic* degraded, with samples like `$2,400 / 3 = $8,000 / 3 = $240`.
And a tell: reward never improved, not even at step 2.
That pattern says noise, not learning.

Each of our updates was built from only 2-4 usable groups.
Production GRPO uses hundreds of questions per update; averaging over many gradients cancels their noise.
Ours barely averaged anything, and once we logged it, we could *measure* the problem: our gradients had norms around 6, swinging the weights wildly every step.

Three standard fixes, all cheap:

```python
grads, grad_norm = optim.clip_grad_norm(grads, max_norm=1.0)  # cap update size
```

plus a lower learning rate, and a stronger KL coefficient.

And one borrowed habit: before betting hours on a full run, we ran an **RL overfit check** - the same idea as SFT's overfit-one-batch, but for RL.
Train on a frozen pool of 8 questions for 20 steps; if the loop can learn at all, reward on that pool must trend up.
It did: from ~0.06 to ~0.44 on the hard questions and ~0.5 to ~0.9 on the easy ones, with bounded KL.
Only then did the full run get launched.

## Watching it learn

Numbers summarise; samples teach.
The repo's report (`gsm/report.py`) renders three things from the training logs into one HTML page:

- **Curves**: loss, reward, KL, gradient norms over time.
- **Probe evolution**: the same 10 questions answered at every checkpoint, side by side - you watch rambling become format become correct solutions.
- **Group inspector**: real GRPO groups with each answer's reward and advantage, so you can see exactly what a policy-gradient step pushes on.

If you clone the repo and run the pipeline, this report is where the understanding happens.

## Where it stands

| Checkpoint | GSM8K zero-shot |
|---|---|
| Qwen2.5-0.5B base | 0.000 |
| + SFT | 0.330 |
| + GRPO (hardened run) | in progress |

The final GRPO number matters less than what the three runs demonstrated:

1. **Post-training is behaviour installation.** The knowledge was in the base model; SFT installed "answer and stop"; RL sharpened "be right".
2. **RL optimises the reward you wrote, not the behaviour you meant.** Every unmeasured behaviour is collateral - that is why the KL leash exists.
3. **Sanity checks scale down.** Overfit-one-batch, sample logging, gradient-norm logging, and an RL overfit check caught every one of this project's failures early, on hardware that costs less than a conference ticket.
