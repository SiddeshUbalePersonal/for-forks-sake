# For Fork's Sake 🍴 - The Gamified Git Visualizer

**For Fork's Sake** is an interactive, web-based playground designed to teach Git concepts visually. Forget blindly entering commands in a black box—**see** exactly what happens when you commit, branch, merge, and reset.

![Graph Visualization](/public/docs/graph-demo.png)

## 🚀 Features

### ♾️ Infinite Canvas
Navigate complex repository histories with ease. The graph includes a robust **Zoom & Pan** engine (built with `react-zoom-pan-pinch`) allowing you to explore massive commit trees or focus on specific details. Includes "Fit to Screen" and manual zoom controls.

### ⌨️ Interactive Terminal
A realistic, regex-powered terminal emulator that accepts real Git commands.
- `git commit -m "msg"`
- `git checkout -b branch`
- `git merge branch`
- `git reset --hard HEAD~1`
- `git log`

### 🎮 Gamified Tutorials
Master the basics through a dedicated **3-Level Tutorial System**:
1.  **The First Commit**: Learn the basics of saving work.
2.  **Branching Out**: Understand parallel development.
3.  **Merge It Back**: Learn how to reconcile changes.

Your progress is automatically saved, so you can pick up right where you left off.

### 🔊 Audio Feedback (Juice 🧃)
Experience satisfying feedback with every interaction.
- **Commits**: Rigid "Thock" sound.
- **Errors**: Distinct buzzer for invalid commands.
- **Success**: 8-bit victory chime when completing levels.
*(Includes a global Mute toggle).*

![Terminal Interaction](/public/docs/terminal-demo.png)

## 🛠️ Technology Stack

Built with a focus on performance, interactivity, and aesthetics.

-   **Framework**: [Next.js 14](https://nextjs.org/) (App Router)
-   **State Management**: [Zustand](https://github.com/pmndrs/zustand)
-   **Animations**: [Framer Motion](https://www.framer.com/motion/)
-   **Canvas/Zoom**: [react-zoom-pan-pinch](https://github.com/prc5/react-zoom-pan-pinch)
-   **Styling**: [Tailwind CSS v4](https://tailwindcss.com/)
-   **Icons**: [Lucide React](https://lucide.dev/)
-   **Themes**: `next-themes` (Dark/Light Hub Support)

## 📦 Getting Started

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/yourusername/for-forks-sake.git
    cd for-forks-sake
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Run the development server:**
    ```bash
    npm run dev
    ```

4.  Open [http://localhost:3000](http://localhost:3000) to start breaking things (safely).

## 🤝 Contributing

We welcome contributions! Whether it's adding a new tutorial level, improving the regex parser, or optimizing the graph layout algorithm.

1.  Fork the Project.
2.  Create your Feature Branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your Changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the Branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

## 📄 License

Distributed under the MIT License. See `LICENSE` for more information.
