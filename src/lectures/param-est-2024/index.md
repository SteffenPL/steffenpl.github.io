---
title: Parameter Estimation for ODE models with Julia
layout: markdown 
---

# {{ title }}
<!-- <img src="https://raw.githubusercontent.com/JuliaLang/julia-logo-graphics/refs/heads/master/images/julia-logo-color.svg"/> -->

**Summary:** _Statistics and optimisation theory provide rich theories to find optimal model parameters for given datapoints. These methodologies adapt well to ODE and PDE models. Depending on the number of unknown parameters and available data, different strategies are optimal. We will discuss optimisation based parameter estimation and automatic differentiation, a technique to obtain accurate gradients. Finally, we look at Bayesian inference, which provides statistical distribution of the most likely parameter combinations._

_The lecture is complemented by code examples in the programming language Julia._

## Material 

Lecture notes and [example code](https://github.com/SteffenPL/ParamEstimationLecture2024) (links in preparation).

## 💻 Setup instructions 

This lecture will be interactive with various coding sessions. Please install Julia in advace! 👍

<div class="mb-4 border-b  border-gray-200 dark:border-gray-700">
    <ul class="flex flex-wrap -mb-px font-medium text-center list-none" id="default-tab" 
    data-tabs-active-classes="text-lime-600 hover:text-lime-600 dark:text-lime-500 dark:hover:text-lime-500 border-lime-600 dark:border-lime-500" data-tabs-inactive-classes="dark:border-transparent text-gray-500 hover:text-gray-600 dark:text-gray-400 border-gray-100 hover:border-gray-300 dark:border-gray-700 dark:hover:text-gray-300"
    data-tabs-toggle="#default-tab-content" role="tablist">
        <li class="me-2" role="presentation">
            <button class="inline-block p-4 border-b-2 rounded-t-lg" id="profile-tab" data-tabs-target="#profile" type="button" role="tab" aria-controls="profile" aria-selected="false">🚀 Short instructions</button>
        </li>
        <li class="me-2" role="presentation">
            <button class="inline-block p-4 border-b-2 rounded-t-lg hover:text-gray-600 hover:border-gray-300 dark:hover:text-gray-300" id="dashboard-tab" data-tabs-target="#dashboard" type="button" role="tab" aria-controls="dashboard" aria-selected="false">🐢 Detailed instructions</button>
        </li>
    </ul>
</div>
<div id="default-tab-content">
    <div class="hidden px-8 py-2 " id="profile" role="tabpanel" aria-labelledby="profile-tab">
        
Please install:
1. [The Julia programming language](https://julialang.org/downloads/), 
2. [Visual Studio Code](https://code.visualstudio.com/), 
3. [Julia for Visual Studio Code](https://www.julia-vscode.org/),
4. Clone [github.com/SteffenPL/ParamEstimationLecture2024](https://github.com/SteffenPL/ParamEstimationLecture2024),
5. Install all required Julia dependencies[^deps]
    - Open the repository in VS Code and **Open Julia REPL**[^2],
    - enter package mode by pressing `]` inside the Julia REPL and 
    - run `activate .` and `instantiate`.

    </div>
    <div class="hidden px-8 py-2 " id="dashboard" role="tabpanel" aria-labelledby="dashboard-tab">

### 1. Installation of the Julia programming language

We will follow the official installation instructions from [julialang.org/downloads](https://julialang.org/downloads/).

- For Windows, open a terminal and type
    ```cmd
    winget install julia -s msstore
    ```

- For Linux/MacOS, open a terminal and type 
    ```cmd
    curl -fsSL https://install.julialang.org | sh
    ```

To test the installation, you can 
type `julia` into the terminal, which should start the most recent version of Julia!

### 2. Installation of VS Code and the Julia extensions

[Visual Studio Code](https://code.visualstudio.com/) is a modern text editor[^1] which can function as an IDE for many programming languages. It is the current de-facto standard for programming in Julia.

We will follow the instructions from [code.visualstudio.com/docs/languages/julia](https://code.visualstudio.com/docs/languages/julia#_getting-started).

- Install VS Code for your platform: [https://code.visualstudio.com/download](code.visualstudio.com/download).
- Open the Julia extension on the VS Code Marketplace and press **Install**; or manually install by doing the following steps:
  - Start VS Code.
  - Inside VS Code, go to the Extensions view by clicking **View** on the top menu bar and then selecting **Extensions**.
  - In the Extensions view, search for the term "julia" in the Marketplace search box, then select the Julia extension (julialang.language-julia) and select the **Install** button.
  - Restart VS Code.

For basic operations inside VS Code, please check [code.visualstudio.com/docs/getstarted/getting-started](https://code.visualstudio.com/docs/getstarted/getting-started).

### 3. Running Julia Code 


- Download the lectures example code from

### 4. Installing Julia dependencies

In Julia, we can install additional functions via packages. The integrated package manager 
allows us to
- install packages globally (into the main enviroment),
- manage packages individually for each project folder (via a `Project.toml` file).

The recommendation is to use individual projects, which is useful as soon as one 
works on several projects with different dependencies in parallel.

#### 4.1 The package manager



    </div>
</div>



[^1]: If you prefer strict free open-source software, one might prefer [VSCodium](https://vscodium.com/).
[^2]: To find any command in Visual Studio code, open the command palette via the shortcut `Shift + Command + P` _(Mac)_ or `Ctrl + Shift + P` _Windows/Linux_.
[^deps]: The dependencies might change shortly before the lecture. If any problems arise, please contact me.