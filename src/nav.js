import React from 'react';
import {
    Icon,
    Api,
    IOS,
    ANDROID,
    WEB,
    WEBOS,
    TIZEN,
    MACOS,
    ANDROID_TV,
    FIREFOX_TV,
    WINDOWS,
    TVOS,
    KAIOS
} from './renative';
import Theme from './theme';

const isDrawerMenuBased = () => navStructure.root.menus.drawerMenu.isVisibleIn.includes(Api.platform);

const isTopMenuBased = () => navStructure.root.menus.topMenu.isVisibleIn.includes(Api.platform);

const navStructure = {
    root: {
        menus: {
            drawerMenu: {
                position: 'left',
                isVisibleIn: [IOS, ANDROID],
                component: 'Menu',
                options: {
                    drawerBackgroundColor: '#222222',
                    drawerWidth: 250
                },
                navigationOptions: {},
            },
            sideMenu: {
                position: 'left',
                isVisibleIn: [MACOS, WINDOWS],
                component: 'Menu',
                options: {
                    menuWidth: 250
                },
                navigationOptions: {},
            },
            topMenu: {
                isVisibleIn: [TVOS, ANDROID_TV, TIZEN, FIREFOX_TV, WEB],
                component: 'Menu',
                options: {
                    menuHeight: 100
                },
                navigationOptions: {},
            },
            tabMenu: {
                position: 'bottom',
                isVisibleIn: [TVOS, ANDROID_TV, TIZEN],
                component: 'Menu',
                navigationOptions: {},
            },
            modalMenu: {
                position: 'hidden',
                isVisibleIn: [KAIOS],
                component: 'Menu',
                navigationOptions: {},
            },
        },
        screens: {
            Home: {
                screen: 'ScreenHome',
                navigationOptions: {
                    title: 'Home'
                },
                stacks: ['stacks.MyPage2', 'stacks.MyPage3'],
            },
            MyPage: {
                screen: 'ScreenMyPage',
                tabMenu: {
                    position: 'bottom',
                    isVisibleIn: [IOS, ANDROID],
                    screens: ['root.MyPage2', 'root.MyPage', 'stacks.MyPage2', 'stacks.MyPage3'],
                },
                navigationOptions: {
                    title: 'My Page'
                },
                stacks: ['stacks.MyPage2'],
            },
        },
        navigationOptions: {
            headerTitleStyle: {
                color: Theme.header.primaryColor,
                fontFamily: Theme.primaryFontFamily,
            },
            headerStyle: {
                backgroundColor: '#222222',
                color: Theme.header.primaryColor,
            },
            headerLeft: (n) => {
                if (!isDrawerMenuBased()) return null;
                return (
                    <Icon
                        iconFont="ionicons"
                        iconName="md-menu"
                        iconColor={Theme.header.primaryColor}
                        style={{ width: 40, height: 40, marginLeft: 10 }}
                        onPress={() => {
                            Api.navigation.openDrawer();
                        }}
                    />
                );
            },
        },
    },
    stacks: {
        screens: {
            MyPage2: {
                screen: 'ScreenMyPage',
                navigationOptions: {
                    title: 'My Page 2',
                },
            },
            MyPage3: {
                screen: 'ScreenMyPage',
                navigationOptions: {
                    title: 'My Page 3',
                },
            },
        },
        navigationOptions: {
            headerStyle: {
                backgroundColor: '#222222',
            },
            headerTitleStyle: {
                color: Theme.header.primaryColor,
                fontFamily: Theme.primaryFontFamily,
            },
        },
    },
    modals: {
        screens: {
            MyModal: {
                screen: 'ScreenModal',
                navigationOptions: {
                    title: 'My Modal',
                },
            },
        },
        navigationOptions: {
            header: null,
        },
    },
};

export { navStructure, isDrawerMenuBased, isTopMenuBased };