import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import DashboardScreen from '../screens/DashboardScreen';
import WalletsScreen from '../screens/WalletsScreen';
import ProfileScreen from '../screens/ProfileScreen';
import LoansScreen from '../screens/LoansScreen';
import GroupsScreen from '../screens/GroupsScreen';
import { Colors } from '../theme/colors';
import { LayoutDashboard, Wallet, User, CircleDollarSign, Users } from 'lucide-react-native';

const Tab = createBottomTabNavigator();

// Custom Premium Floating Tab Bar
const CustomTabBar = ({ state, descriptors, navigation }: any) => {
    return (
        <View style={styles.tabBarContainer}>
            <View style={styles.tabBar}>
                {state.routes.map((route: any, index: number) => {
                    const { options } = descriptors[route.key];
                    const isFocused = state.index === index;

                    const onPress = () => {
                        const event = navigation.emit({
                            type: 'tabPress',
                            target: route.key,
                            canPreventDefault: true,
                        });

                        if (!isFocused && !event.defaultPrevented) {
                            navigation.navigate(route.name);
                        }
                    };

                    const getIcon = () => {
                        const color = isFocused ? Colors.primary : Colors.textSecondary;
                        const size = 24;
                        switch (route.name) {
                            case 'Dashboard': return <LayoutDashboard color={color} size={size} />;
                            case 'Wallets': return <Wallet color={color} size={size} />;
                            case 'Groups': return <Users color={color} size={size} />;
                            case 'Loans': return <CircleDollarSign color={color} size={size} />;
                            case 'Profile': return <User color={color} size={size} />;
                            default: return null;
                        }
                    };

                    return (
                        <TouchableOpacity
                            key={index}
                            accessibilityRole="button"
                            accessibilityState={isFocused ? { selected: true } : {}}
                            accessibilityLabel={options.tabBarAccessibilityLabel}
                            testID={options.tabBarTestID}
                            onPress={onPress}
                            style={styles.tabItem}
                        >
                            <View style={[styles.iconContainer, isFocused && styles.iconContainerFocused]}>
                                {getIcon()}
                            </View>
                        </TouchableOpacity>
                    );
                })}
            </View>
        </View>
    );
};

export default function TabNavigator() {
    return (
        <Tab.Navigator
            tabBar={(props) => <CustomTabBar {...props} />}
            screenOptions={{
                headerShown: false,
            }}
        >
            <Tab.Screen name="Dashboard" component={DashboardScreen} />
            <Tab.Screen name="Wallets" component={WalletsScreen} />
            <Tab.Screen name="Groups" component={GroupsScreen} />
            <Tab.Screen name="Loans" component={LoansScreen} /> 
            <Tab.Screen name="Profile" component={ProfileScreen} />
        </Tab.Navigator>
    );
}

const styles = StyleSheet.create({
    tabBarContainer: {
        position: 'absolute',
        bottom: 30,
        left: 20,
        right: 20,
        alignItems: 'center',
    },
    tabBar: {
        flexDirection: 'row',
        backgroundColor: 'rgba(15, 23, 42, 0.9)', // Slate 900
        borderRadius: 40,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        paddingHorizontal: 20,
        paddingVertical: 10,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 10 },
        shadowOpacity: 0.5,
        shadowRadius: 20,
        elevation: 10,
        width: '100%',
        justifyContent: 'space-between',
    },
    tabItem: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainer: {
        width: 48,
        height: 48,
        borderRadius: 24,
        alignItems: 'center',
        justifyContent: 'center',
    },
    iconContainerFocused: {
        backgroundColor: 'rgba(245, 158, 11, 0.15)', // Gold background for active tab
    }
});
