---
title: Parameter Estimation for differential equations with Julia
layout: markdown 
---

# 📊 {{ title }}
<!-- <img src="https://raw.githubusercontent.com/JuliaLang/julia-logo-graphics/refs/heads/master/images/julia-logo-color.svg"/> -->


*This lecture is part of the lecture series organized by the [Research Center of Mathematics for Social Creativity, Research Institute for Electronic Science, Hokkaido University](https://mmc01.es.hokudai.ac.jp/msc/en/){target="_blank"}.*

---
## 📑 Summary

_Statistics and optimisation theory provide rich theories to find optimal model parameters for given datapoints. These methodologies adapt well to ODE and PDE models. Depending on the number of unknown parameters and available data, different strategies are optimal. We will discuss optimisation based parameter estimation and automatic differentiation, a technique to obtain accurate gradients._

<div class="drop-shadow-lg mx-auto">

    <img src="imgs/anim_fps5.gif" class="mx-auto"></img>

</div>

<div class="text-center text-sm">

    *Figure:* Example parameter fitting using an $L^2$ error and a quasi-Newton (LBFGS) solver. 

</div>

## 📚 Material 

[Lecture notes]({{ '/assets/param_est_2024.pdf' | url }}) and [example code](https://github.com/SteffenPL/ParamEstimationLecture2024) (links in preparation).

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
5. Install all required Julia dependencies[^deps] either by running the file `000_setup.jl` or with the following steps:
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

**The most useful command in Visual Studio Code is the 
command palette, where you can search for any commands!**
- You can access it with the shortcut: `Shift + Command + P` _(Mac)_ or `Ctrl + Shift + P` _Windows/Linux_.
  - For example: Search for `Preferences: Color Theme` to select a nice theme!

### 3. Installing Julia dependencies
 

- **Download the lectures example code from [github.com/SteffenPL/ParamEstimationLecture2024](https://github.com/SteffenPL/ParamEstimationLecture2024)**.
- Open the folder with Visual Studio Code `File > Open Folder`.[^trust]
- Open the file `000_setup.jl` and press the run button in the top right corner of the editor (or run the command `Julia: Execute Active File in REPL`[^2]). This should download and install all requirements.
- To test the installation, open the file `002_first_example.jl` and also run this file. It should display a plot of an ODE solution.[^slow] 

![](imgs/julia_ide.png)

### 4. Running Julia Code

You can also run Julia code by selecting a few lines in the editor and using the shortcut `Shift+Enter`.

### 5. A note on installing Julia packages

One of the best features of Julia is the large ecosystem of very modern scientific computing packages. One can see a great overview at the [documentation side of the SciML project (Scientific Machine Learning)](https://docs.sciml.ai/). 

![](imgs/docs.png)

To `add` a new package to your current code, you can use the integrated Julia package manager as follows:
- Open a Julia REPL.
- Press the `]` key to enter the package mode.
- Optional but recommended: Activate a new Julia enviroment for your current folder with the command `activate .` (where `.` denotes the current folder).
- Use the command `add` to install a new package, for example via 
```
add OrdinaryDiffEq Plots
```
to install the two packages `OrdinaryDiffEq` and `Plots`.

Once you added a package, you and use it's functions with the Julia command
```
using OrdinaryDiffEq, Plots
```
inside your Julia code.


    </div>
</div>

## 💬 Organisation

- This lecture is given in **English**.
- It is part of the lecture series organized by the [Research Center of Mathematics for Social Creativity, Research Institute for Electronic Science, Hokkaido University](https://mmc01.es.hokudai.ac.jp/msc/en/){target="_blank"}.
- This lecture series is supported by
  - **JSPS KAKENHI** _Grant Number JP23H04936, 23K13013, 24H00188_
  - **JST CREST** _Grant Number JPMJCR1926_
  - **JST Moonshot Program** _Grant Number JPMJMS2023_

## 🔗 Useful links


- Julia Tutorial: [docs.julialang.org/en/v1](https://docs.julialang.org/en/v1/manual/variables/)
- Cheat-Sheet: [steffenpl.github.io/Julia-Cheat-Sheet](https://steffenpl.github.io/Julia-Cheat-Sheet/)
- Modern Julia: https://modernjuliaworkflows.org/
- Noteworthy differences (from MATLAB/Python/C...): [docs.julialang.org/en/v1/manual/noteworthy-differences](https://docs.julialang.org/en/v1/manual/noteworthy-differences/)
- Very friendly discussion forum with some strong mathematicians as regulars: [discourse.julialang.org](https://discourse.julialang.org/)

[^1]: If you prefer strict free open-source software, one might prefer [VSCodium](https://vscodium.com/).
[^2]: To find any command in Visual Studio code, open the command palette via the shortcut `Shift + Command + P` _(Mac)_ or `Ctrl + Shift + P` _Windows/Linux_.
[^deps]: The dependencies might change shortly before the lecture. If any problems arise, please contact me.
[^slow]: The first runtime might be slow, due to one-time precompilation.
[^trust]: The first time you open a new folder, Visual Studio Code might ask you to confirm that you trust the files. This is normal behaviour and in order to work on a program you need to agree to trust the folder: ![](imgs/trust.png)