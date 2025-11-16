"use strict";

import * as Router from "./Router.js";
import * as Authentication from "./Authentication.js";
import * as Account from "./Account.js";

await Router.setup();
await Authentication.loadUser();
await Account.setup();