# Stroop Test Implementation

This is a browser-based implementation of the classic Stroop Test, used to measure selective attention, cognitive inhibition, and processing speed.

## About the Stroop Test

The Stroop Test measures cognitive processes by introducing interference between automatic and controlled processes. It consists of three main parts:

1. **Word Reading**: Reading color words printed in black ink
2. **Color Naming**: Naming the colors of colored blocks
3. **Color-Word Naming (Interference)**: Naming the ink color of words where the word and ink color are incongruent

The test demonstrates the "Stroop Effect" - the delay in reaction time when the name of a color is printed in a different color ink.

## What This Test Measures

- **Selective Attention**: Ability to focus on relevant information while ignoring distractions
- **Cognitive Inhibition**: Ability to suppress automatic responses
- **Processing Speed**: How quickly someone can process information and perform cognitive tasks
- **Automaticity of Reading**: The automatic nature of reading for literate individuals

## How to Use This Application

1. Start the test by clicking the "Begin Test" button
2. Follow the instructions for each part of the test
3. Use the spacebar to start and stop timing for each test condition
4. After completing all three parts, view your results and interpretation

## Scoring

The application calculates:
- Completion time for each condition
- Difference Score (Incongruent Time - Color Naming Time)
- Ratio Score (Incongruent Time / Color Naming Time)

Higher interference scores indicate greater difficulty with cognitive inhibition.

## Technical Implementation

- HTML/CSS/JavaScript application
- No external dependencies required
- Randomly generates test items for each condition
- Times performance using JavaScript's Date object
- Calculates and displays interference scores and basic interpretation
