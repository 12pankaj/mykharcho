import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider, useAuth } from './src/context/AuthContext';
import LoginScreen from './src/screens/LoginScreen';
import SignupScreen from './src/screens/SignupScreen';
import ForgotPasswordScreen from './src/screens/ForgotPasswordScreen';
import TabNavigator from './src/navigation/TabNavigator';
import TransactionsScreen from './src/screens/TransactionsScreen';
import AdminDashboardScreen from './src/screens/admin/AdminDashboardScreen';
import AdminChatScreen from './src/screens/admin/AdminChatScreen';
import AdminUsersScreen from './src/screens/admin/AdminUsersScreen';
import AdminPlansScreen from './src/screens/admin/AdminPlansScreen';
import AdminPaymentsScreen from './src/screens/admin/AdminPaymentsScreen';
import AutomationScreen from './src/screens/AutomationScreen';
import GroupsScreen from './src/screens/GroupsScreen';
import GroupDetailsScreen from './src/screens/GroupDetailsScreen';
import SupportTicketsScreen from './src/screens/SupportTicketsScreen';
import PlansScreen from './src/screens/PlansScreen';
import LoanPaymentScreen from './src/screens/LoanPaymentScreen';
import AddWalletScreen from './src/screens/AddWalletScreen';
import AddTransactionScreen from './src/screens/AddTransactionScreen';
import AddGroupScreen from './src/screens/AddGroupScreen';
import AddGroupMemberScreen from './src/screens/AddGroupMemberScreen';
import AddGroupExpenseScreen from './src/screens/AddGroupExpenseScreen';
import GroupSettleUpScreen from './src/screens/GroupSettleUpScreen';
import AddLoanScreen from './src/screens/AddLoanScreen';
import { View, ActivityIndicator } from 'react-native';
import { Colors } from './src/theme/colors';

const Stack = createNativeStackNavigator();

function Navigation() {
    const { token, isLoading } = useAuth();

    if (isLoading) {
        return (
            <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.background }}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    return (
        <NavigationContainer>
            <Stack.Navigator screenOptions={{ headerShown: false }}>
                {token == null ? (
                    <>
                        <Stack.Screen name="Login" component={LoginScreen} />
                        <Stack.Screen name="Signup" component={SignupScreen} />
                        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
                    </>
                ) : (
                    <>
                        <Stack.Screen name="Main" component={TabNavigator} /> 
                        <Stack.Screen name="Transactions" component={TransactionsScreen} />
                        <Stack.Screen name="Groups" component={GroupsScreen} />
                        <Stack.Screen name="GroupDetails" component={GroupDetailsScreen} />
                        <Stack.Screen name="Automation" component={AutomationScreen} />
                        <Stack.Screen name="SupportTickets" component={SupportTicketsScreen} />
                        <Stack.Screen name="Plans" component={PlansScreen} />
                        <Stack.Screen name="AdminDashboard" component={AdminDashboardScreen} />
                        <Stack.Screen name="AdminUsers" component={AdminUsersScreen} />
                        <Stack.Screen name="AdminPlans" component={AdminPlansScreen} />
                        <Stack.Screen name="AdminChat" component={AdminChatScreen} />
                        <Stack.Screen name="AdminPayments" component={AdminPaymentsScreen} />
                        <Stack.Screen name="LoanPayment" component={LoanPaymentScreen} />
                        <Stack.Screen name="AddWallet" component={AddWalletScreen} />
                        <Stack.Screen name="AddTransaction" component={AddTransactionScreen} />
                        <Stack.Screen name="AddGroup" component={AddGroupScreen} />
                        <Stack.Screen name="AddGroupMember" component={AddGroupMemberScreen} />
                        <Stack.Screen name="AddGroupExpense" component={AddGroupExpenseScreen} />
                        <Stack.Screen name="GroupSettleUp" component={GroupSettleUpScreen} />
                        <Stack.Screen name="AddLoan" component={AddLoanScreen} />
                    </>
                )}
            </Stack.Navigator>
        </NavigationContainer>
    );
}

export default function App() {
    return (
        <AuthProvider>
            <StatusBar style="light" />
            <Navigation />
        </AuthProvider>
    );
}
