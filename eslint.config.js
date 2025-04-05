// eslint.config.js
import js from "@eslint/js";

export default [
    js.configs.recommended,
    {
        rules: {
            "no-unused-vars": [
                "warn",
                {
                    "varsIgnorePattern": "^_",
                    "argsIgnorePattern": "^_",
                }
            ]
        },
        languageOptions: {
            globals: {
                Component: "readonly",
                Constructibles: "readonly",
                Controls: "readonly",
                CustomEvent: "readonly",
                Database: "readonly",
                DirectionTypes: "readonly",
                Districts: "readonly",
                DistrictTypes: "readonly",
                Event: "readonly",
                FeatureTypes: "readonly",
                Game: "readonly",
                GameContext: "readonly",
                GameInfo: "readonly",
                GameplayMap: "readonly",
                Input: "readonly",
                InputActionStatuses: "readonly",
                InputContext: "readonly",
                InterfaceMode: "readonly",
                Loading: "readonly",
                Locale: "readonly",
                MapConstructibles: "readonly",
                Players: "readonly",
                ProgressionTreeNodeState: "readonly",
                ResourceTypes: "readonly",
                RevealedStates: "readonly",
                RiverTypes: "readonly",
                UI: "readonly",
                WorldAnchors: "readonly",
                WorldUI: "readonly",
                console: "readonly",
                document: "readonly",
                engine: "readonly",
                window: "readonly",
            }
        }

    }
];
