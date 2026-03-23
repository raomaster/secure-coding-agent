// src/args.ts — CLI argument parsing

import { DEFAULT_HOST, SUPPORTED_HOSTS, type InstallHost } from "./host.js";

export interface InstallArgs {
    target: string;
    host: InstallHost;
    mcp: boolean;
    skipSecurity: boolean;
    profile: "standard" | "lite";
    help: boolean;
    version: boolean;
}

function readOptionValue(argv: string[], index: number, option: string): string {
    const value = argv[index + 1];
    if (!value || value.startsWith("--")) {
        throw new Error(`Missing value for ${option}.`);
    }
    return value;
}

export function parseArgs(argv: string[]): InstallArgs {
    const args: InstallArgs = {
        target: ".",
        host: DEFAULT_HOST,
        mcp: false,
        skipSecurity: false,
        profile: "standard",
        help: false,
        version: false,
    };

    for (let i = 0; i < argv.length; i++) {
        const arg = argv[i];
        switch (arg) {
            case "--help":
            case "-h":
                args.help = true;
                break;
            case "--version":
            case "-v":
                args.version = true;
                break;
            case "--mcp":
                args.mcp = true;
                break;
            case "--no-security":
                args.skipSecurity = true;
                break;
            case "--target":
                args.target = readOptionValue(argv, i, "--target");
                i++;
                break;
            case "--host":
                const host = readOptionValue(argv, i, "--host");
                if (SUPPORTED_HOSTS.includes(host as InstallHost)) {
                    args.host = host as InstallHost;
                    i++;
                } else {
                    throw new Error(
                        `Invalid host: ${host}. Use ${SUPPORTED_HOSTS.join(", ")}.`
                    );
                }
                break;
            case "--profile":
                const profile = readOptionValue(argv, i, "--profile");
                if (profile === "lite" || profile === "standard") {
                    args.profile = profile;
                    i++;
                } else {
                    throw new Error(`Invalid profile: ${profile}. Use 'standard' or 'lite'.`);
                }
                break;
            default:
                // Positional arg → target dir
                if (!arg.startsWith("--")) {
                    args.target = arg;
                }
        }
    }

    return args;
}
