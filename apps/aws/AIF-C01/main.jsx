/* main.jsx — AIF-C01 entry. Wires this app's config + datasets into the
   shared framework. Adding a new exam app means copying this file and
   swapping config / cards / quiz — no framework code is touched. */

import { createApp } from "@framework/createApp.jsx";
import config from "./config.js";
import { data } from "./cards.js";
import { quiz } from "./quiz.js";

createApp({ config, data, quiz });
