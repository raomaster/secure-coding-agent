// src/args.ts — CLI argument parsing

export interface InstallArgs {
    target: string;
    mcp: boolean;
    skipSecurity: boolean;
    profile: "standard" | "lite";
    help: boolean;
    version: boolean;
}

export function parseArgs(argv: string[]): InstallArgs {
    const args: InstallArgs = {
        target: ".",
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
                args.target = argv[++i] ?? ".";
                break;
            case "--profile":
                const profile = argv[++i];
                if (profile === "lite" || profile === "standard") {
                    args.profile = profile;
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
