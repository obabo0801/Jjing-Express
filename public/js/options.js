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

export const OPTION_VALUE = {
    notifyEnable: ['0', '1'],
    notifySound: ['0', '1'],
    screenScale: ['1', '1.1', '1.25', '1.5'],
    fontScale: ['1', '1.1', '1.25', '1.5'],
    settingsType: ['general', 'notification']
};

export function getOption(key, defaultValue) {
    const value = localStorage.getItem(key);

    if (value === null) {
        return defaultValue;
    }

    const name = Object
        .entries(OPTION)
        .find(([, optionKey]) => {
            return optionKey === key;
        })?.[0];

    if (!name) {
        return defaultValue;
    }

    const values = OPTION_VALUE[name];

    if (!values.includes(value)) {
        localStorage.removeItem(key);

        return defaultValue;
    }

    return value;
}