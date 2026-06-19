export const OPTION = {
    notifyEnable: 'jjing-notify-enable',
    notifySound: 'jjing-notify-sound',
    screenScale: 'jjing-screen-scale',
    fontScale: 'jjing-font-scale',
    settingsType: 'jjing-settings-type'
};

export const DEFAULT_OPTION = {
    notifyEnable: '1',
    notifySound: '0',
    screenScale: '1',
    fontScale: '1',
    settingsType: 'general'
};

export function getOption(key, defaultValue) {
    const value = localStorage.getItem(key);

    return value === null
        ? defaultValue
        : value;
}