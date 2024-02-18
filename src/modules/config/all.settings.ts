import { AppSetting } from "./app.settings";
import { oIDPSettings } from "./oidp.settings";

export const allSettings = [
    ...AppSetting,
    ...oIDPSettings,
]