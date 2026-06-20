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

const ON_OFF = [
    '0',
    '1'
];

export const OPTION_VALUE = {
    [OPTION.notifyEnable]: ON_OFF,
    [OPTION.notifySound]: ON_OFF,
    [OPTION.screenScale]: [
        '0.9',
        '1',
        '1.1',
        '1.2',
        '1.3',
        '1.4',
        '1.5'
    ],
    [OPTION.fontScale]: [
        '0.9',
        '1',
        '1.1',
        '1.2',
        '1.3'
    ],
    [OPTION.settingsType]: [
        'general',
        'notification'
    ]
};

export function getOption(key, defaultValue) {
    const value = localStorage.getItem(key);
    const values = OPTION_VALUE[key];

    if (value !== null
        && values?.includes(value)) {
        return value;
    }

    if (value !== null) {
        localStorage.removeItem(key);
    }

    return defaultValue;
}