import React, { useEffect, useState, useRef } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../../theme/colors';
import Header from '../../components/Header';
import { io, Socket } from 'socket.io-client';
import { Send, UserCircle, MessageSquare } from 'lucide-react-native';

export default function AdminChatScreen({ navigation }: any) {
    const [socket, setSocket] = useState<Socket | null>(null);
    const [visitors, setVisitors] = useState<any[]>([]);
    const [activeVisitorId, setActiveVisitorId] = useState<string | null>(null);
    const [messages, setMessages] = useState<{ [visitorId: string]: any[] }>({});
    const [reply, setReply] = useState('');
    const scrollViewRef = useRef<ScrollView>(null);

    useEffect(() => {
        // Since we are using an emulator/device, we should point to the DevTunnel URL or backend IP
        // DevTunnel: https://d7nql637-5010.inc1.devtunnels.ms
        const newSocket = io('https://d7nql637-5010.inc1.devtunnels.ms');
        setSocket(newSocket);

        newSocket.on('connect', () => {
            console.log('Connected to socket server as admin');
            newSocket.emit('join_admin');
        });

        newSocket.on('visitor_waiting', (data) => {
            setVisitors(prev => {
                if (!prev.find(v => v.visitorId === data.visitorId)) {
                    return [...prev, data];
                }
                return prev;
            });
            setMessages(prev => ({
                ...prev,
                [data.visitorId]: [{ sender: 'visitor', message: data.message }]
            }));
        });

        newSocket.on('receive_admin_message', (data) => {
            const { visitorId, message } = data;
            setMessages(prev => ({
                ...prev,
                [visitorId]: [...(prev[visitorId] || []), { sender: 'visitor', message }]
            }));
        });

        return () => {
            newSocket.disconnect();
        };
    }, []);

    const handleSend = () => {
        if (!reply.trim() || !activeVisitorId || !socket) return;
        
        setMessages(prev => ({
            ...prev,
            [activeVisitorId]: [...(prev[activeVisitorId] || []), { sender: 'admin', message: reply }]
        }));

        socket.emit('admin_send_message', { visitorId: activeVisitorId, message: reply });
        setReply('');
        setTimeout(() => scrollViewRef.current?.scrollToEnd({ animated: true }), 100);
    };

    return (
        <KeyboardAvoidingView 
            style={styles.container} 
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <Header title="Live Support" subtitle="Marketing Site Chat" />
            
            {/* Active Visitors Scroll */}
            <View style={styles.visitorsWrapper}>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.visitorsContainer}>
                    {visitors.length === 0 ? (
                        <View style={styles.noVisitors}>
                            <Text style={styles.noVisitorsText}>No active visitors online</Text>
                        </View>
                    ) : (
                        visitors.map(v => (
                            <TouchableOpacity 
                                key={v.visitorId}
                                onPress={() => setActiveVisitorId(v.visitorId)}
                                style={[styles.visitorBadge, activeVisitorId === v.visitorId && styles.visitorBadgeActive]}
                            >
                                <UserCircle color={activeVisitorId === v.visitorId ? '#fff' : Colors.textSecondary} size={20} />
                                <Text style={[styles.visitorName, activeVisitorId === v.visitorId && styles.visitorNameActive]}>
                                    {v.name}
                                </Text>
                            </TouchableOpacity>
                        ))
                    )}
                </ScrollView>
            </View>

            {/* Chat Area */}
            <View style={styles.chatArea}>
                {activeVisitorId ? (
                    <>
                        <ScrollView 
                            ref={scrollViewRef}
                            contentContainerStyle={styles.messagesContainer}
                        >
                            {(messages[activeVisitorId] || []).map((m, i) => (
                                <View key={i} style={[styles.messageWrapper, m.sender === 'admin' ? styles.messageRight : styles.messageLeft]}>
                                    <View style={[styles.messageBubble, m.sender === 'admin' ? styles.bubbleAdmin : styles.bubbleVisitor]}>
                                        <Text style={[styles.messageText, m.sender === 'admin' ? styles.textAdmin : styles.textVisitor]}>
                                            {m.message}
                                        </Text>
                                    </View>
                                </View>
                            ))}
                        </ScrollView>

                        <View style={styles.inputArea}>
                            <TextInput 
                                style={styles.input}
                                placeholder="Type your reply..."
                                placeholderTextColor={Colors.textSecondary}
                                value={reply}
                                onChangeText={setReply}
                                onSubmitEditing={handleSend}
                            />
                            <TouchableOpacity style={styles.sendBtn} onPress={handleSend}>
                                <Send color="#fff" size={20} />
                            </TouchableOpacity>
                        </View>
                    </>
                ) : (
                    <View style={styles.emptyState}>
                        <MessageSquare color={Colors.textSecondary} size={48} />
                        <Text style={styles.emptyStateText}>Select a visitor above to start chatting</Text>
                    </View>
                )}
            </View>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    visitorsWrapper: {
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)',
        paddingBottom: 16,
    },
    visitorsContainer: {
        paddingHorizontal: 24,
        gap: 12,
    },
    noVisitors: {
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
    },
    noVisitorsText: {
        color: Colors.textSecondary,
        fontWeight: '600',
    },
    visitorBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 8,
        paddingHorizontal: 16,
        paddingVertical: 10,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
    },
    visitorBadgeActive: {
        backgroundColor: Colors.primary,
    },
    visitorName: {
        color: Colors.textSecondary,
        fontWeight: '700',
    },
    visitorNameActive: {
        color: '#fff',
    },
    chatArea: {
        flex: 1,
    },
    messagesContainer: {
        padding: 24,
        gap: 16,
    },
    messageWrapper: {
        flexDirection: 'row',
    },
    messageLeft: {
        justifyContent: 'flex-start',
    },
    messageRight: {
        justifyContent: 'flex-end',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 16,
        borderRadius: 20,
    },
    bubbleVisitor: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderTopLeftRadius: 4,
    },
    bubbleAdmin: {
        backgroundColor: Colors.primary,
        borderTopRightRadius: 4,
    },
    textVisitor: {
        color: Colors.textPrimary,
        fontSize: 15,
        fontWeight: '500',
    },
    textAdmin: {
        color: '#fff',
        fontSize: 15,
        fontWeight: '600',
    },
    inputArea: {
        flexDirection: 'row',
        padding: 16,
        paddingBottom: Platform.OS === 'ios' ? 32 : 16,
        backgroundColor: 'rgba(0,0,0,0.3)',
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        alignItems: 'center',
        gap: 12,
    },
    input: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 24,
        paddingHorizontal: 20,
        paddingVertical: 14,
        color: Colors.textPrimary,
        fontSize: 15,
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    emptyState: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        padding: 40,
    },
    emptyStateText: {
        color: Colors.textSecondary,
        fontSize: 15,
        fontWeight: '600',
        marginTop: 16,
        textAlign: 'center',
    }
});
