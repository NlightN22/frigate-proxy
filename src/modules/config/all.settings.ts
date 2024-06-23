import { AppSetting } from "./app.settings";
import { oIDPSettings } from "./oidp/oidp.settings";

export const allSettings = [
    ...AppSetting,
    ...oIDPSettings,
]