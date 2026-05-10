"use strict";

/**
 * Minimal UDP OSC "desk" for local UI development.
 *
 * Listen on the desk RECEIVE port (admin "Receive Port"), same as OSCWebMixer sends queries to.
 * Defaults match `node index.js --mock` (desk 127.0.0.1:9109).
 *
 * Run: node scripts/mock-desk.js [--port 9109] [--channels 8] [--auxes 4] [--verbose]
 * Or: OSC_MOCK_PORT=9109 OSC_MOCK_CHANNELS=8 OSC_MOCK_AUXES=4 node scripts/mock-desk.js
 */

const osc = require("osc");

function parseArgs() {
  const out = {
    port: Number(process.env.OSC_MOCK_PORT) || 9109,
    channels: Number(process.env.OSC_MOCK_CHANNELS) || 8,
    auxes: Number(process.env.OSC_MOCK_AUXES) || 4,
    verbose:
      process.env.OSC_MOCK_VERBOSE === "1" || process.env.OSC_MOCK_VERBOSE === "true",
  };
  const a = process.argv.slice(2);
  for (let i = 0; i < a.length; i++) {
    const k = a[i];
    const v = a[i + 1];
    if (k === "--port" && v) {
      out.port = Number(v);
      i++;
    } else if (k === "--channels" && v) {
      out.channels = Number(v);
      i++;
    } else if (k === "--auxes" && v) {
      out.auxes = Number(v);
      i++;
    } else if (k === "--verbose" || k === "-v") {
      out.verbose = true;
    }
  }
  return out;
}

const opts = parseArgs();

if (
  opts.port !== opts.port ||
  opts.channels !== opts.channels ||
  opts.auxes !== opts.auxes
) {
  console.error(
    "Invalid --port/--channels/--auxes (must be positive numbers)."
  );
  process.exit(1);
}

/** DiGiCo iPad OSC: 2 stereo bus, 1 mono. Mock uses stereo for nicer pan UI testing. */
const AUX_MODE_STEREO = 2;

const udpPort = new osc.UDPPort({
  localAddress: "0.0.0.0",
  localPort: opts.port,
});

function send(msg, remote) {
  if (opts.verbose)
    console.log(
      `[mock-desk] -> ${remote.address}:${remote.port} ${JSON.stringify(msg)}`
    );
  udpPort.send(msg, remote.address, remote.port);
}

function stripQuery(address) {
  return address.endsWith("/?") ? address.slice(0, -2) : address;
}

udpPort.on("message", (oscMsg, _timeTag, info) => {
  const addr = oscMsg.address;
  if (opts.verbose)
    console.log(
      `[mock-desk] <- ${info.address}:${info.port} ${JSON.stringify(oscMsg)}`
    );

  const reply = (m) => send(m, info);

  if (addr.endsWith("/?")) {
    const base = stripQuery(addr);

    if (base === "/Console/Channels") {
      reply({ address: "/Console/Input_Channels", args: [opts.channels] });
      return;
    }

    if (base === "/Console/Aux_Outputs/modes") {
      const modes = Array.from({ length: opts.auxes }, () => AUX_MODE_STEREO);
      reply({ address: "/Console/Aux_Outputs/modes", args: modes });
      return;
    }

    let mAux = /^\/Aux_Outputs\/([0-9]+)\/Buss_Trim\/name$/.exec(base);
    if (mAux) {
      const i = Number(mAux[1]);
      reply({
        address: `/Aux_Outputs/${i}/Buss_Trim/name`,
        args: [`Mock Aux ${i}`],
      });
      return;
    }

    let mCh = /^\/Input_Channels\/([0-9]+)\/Channel_Input\/name$/.exec(base);
    if (mCh) {
      const i = Number(mCh[1]);
      reply({
        address: `/Input_Channels/${i}/Channel_Input/name`,
        args: [`Input ${String(i).padStart(2, "0")}`],
      });
      return;
    }

    if (base === "/Snapshots/Current_Snapshot") {
      reply({ address: "/Snapshots/Current_Snapshot", args: [-1] });
      return;
    }

    mCh = /^\/Input_Channels\/([0-9]+)\/Aux_Send\/([0-9]+)\/send_level$/.exec(
      base
    );
    if (mCh) {
      reply({
        address: `/Input_Channels/${mCh[1]}/Aux_Send/${mCh[2]}/send_level`,
        args: [-80],
      });
      return;
    }

    mCh = /^\/Input_Channels\/([0-9]+)\/Aux_Send\/([0-9]+)\/send_pan$/.exec(
      base
    );
    if (mCh) {
      reply({
        address: `/Input_Channels/${mCh[1]}/Aux_Send/${mCh[2]}/send_pan`,
        args: [0.5],
      });
      return;
    }

    console.warn(`[mock-desk] unhandled query: ${addr}`);
    return;
  }

  /* Level/pan/commands from OSCWebMixer: echo so the server caches and fans out to browsers. */
  if (
    /\/Aux_Outputs\/[0-9]+\/Buss_Trim\/name$/.test(addr) ||
    /\/Input_Channels\/[0-9]+\/Channel_Input\/name$/.test(addr) ||
    /\/Input_Channels\/[0-9]+\/Aux_Send\/[0-9]+\/send_level$/.test(addr) ||
    /\/Input_Channels\/[0-9]+\/Aux_Send\/[0-9]+\/send_pan$/.test(addr)
  ) {
    reply(oscMsg);
    return;
  }

  console.warn(`[mock-desk] ignored: ${addr}`);
});

udpPort.on("error", (err) => console.error("[mock-desk] UDP error", err));

udpPort.on("ready", () => {
  console.log(
    `[mock-desk] Listening UDP 0.0.0.0:${opts.port} (${opts.channels} ch, ${opts.auxes} aux). Set admin desk IP to this machine (e.g. 127.0.0.1) and desk receive port to ${opts.port}. [--verbose for traffic]`
  );
});

udpPort.open();
