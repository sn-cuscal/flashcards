/* main.jsx — live quiz entry. The game UI lives in src/game; this file only
   wires in this app's config and the question bank registry. */

import React from "react";
import { createRoot } from "react-dom/client";
import { GameApp } from "@game/GameApp.jsx";
import "@game/game.css";
import config from "./config.js";
import { banks } from "./banks.js";

document.title = config.documentTitle;
createRoot(document.getElementById("root")).render(<GameApp config={config} banks={banks} />);
