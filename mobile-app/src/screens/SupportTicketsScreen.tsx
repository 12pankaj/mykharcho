import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, RefreshControl, TouchableOpacity, TextInput, ActivityIndicator, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { Colors } from '../theme/colors';
import Header from '../components/Header';
import GlassCard from '../components/GlassCard';
import CustomBottomSheet from '../components/CustomBottomSheet';
import { MessageSquare, Plus, X, Send, ChevronLeft } from 'lucide-react-native';
import { SupportService } from '../api/apiService';

export default function SupportTicketsScreen() {
    const [tickets, setTickets] = useState([]);
    const [refreshing, setRefreshing] = useState(false);
    const [loading, setLoading] = useState(true);

    // Form State for New Ticket
    const [sheetVisible, setSheetVisible] = useState(false);
    const [subject, setSubject] = useState('');
    const [description, setDescription] = useState('');
    const [priority, setPriority] = useState('Normal');
    const [submitting, setSubmitting] = useState(false);

    // Chat State
    const [chatVisible, setChatVisible] = useState(false);
    const [selectedTicket, setSelectedTicket] = useState<any>(null);
    const [messages, setMessages] = useState([]);
    const [replyMessage, setReplyMessage] = useState('');
    const [sendingReply, setSendingReply] = useState(false);
    const [loadingMessages, setLoadingMessages] = useState(false);

    const fetchTickets = async () => {
        try {
            const res = await SupportService.getTickets();
            setTickets(res.data.tickets || []);
        } catch (err) {
            console.error('Failed to load tickets', err);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchTickets();
    }, []);

    const fetchMessages = async (ticketId: string) => {
        try {
            const res = await SupportService.getMessages(ticketId);
            setMessages(res.data.messages || []);
        } catch (err) {
            console.error('Failed to load messages');
        }
    };

    useEffect(() => {
        let interval: any;
        if (chatVisible && selectedTicket) {
            interval = setInterval(() => {
                fetchMessages(selectedTicket.id);
            }, 5000);
        }
        return () => {
            if (interval) clearInterval(interval);
        };
    }, [chatVisible, selectedTicket]);

    const onRefresh = async () => {
        setRefreshing(true);
        await fetchTickets();
        setRefreshing(false);
    };

    const handleCreateTicket = async () => {
        if (!subject || !description) {
            Alert.alert("Error", "Please fill in all fields.");
            return;
        }
        setSubmitting(true);
        try {
            await SupportService.createTicket({ subject, description, priority });
            setSheetVisible(false);
            setSubject('');
            setDescription('');
            setPriority('Normal');
            fetchTickets();
            Alert.alert("Success", "Support ticket created");
        } catch (err) {
            Alert.alert("Error", "Failed to create ticket");
        } finally {
            setSubmitting(false);
        }
    };

    const openChat = async (ticket: any) => {
        setSelectedTicket(ticket);
        setChatVisible(true);
        setLoadingMessages(true);
        try {
            await fetchMessages(ticket.id);
        } finally {
            setLoadingMessages(false);
        }
    };

    const handleSendReply = async () => {
        if (!replyMessage.trim() || !selectedTicket) return;
        setSendingReply(true);
        try {
            const res = await SupportService.addMessage(selectedTicket.id, replyMessage);
            setMessages([...messages, res.data.message] as any);
            setReplyMessage('');
        } catch (err) {
            Alert.alert("Error", "Failed to send message");
        } finally {
            setSendingReply(false);
        }
    };

    if (loading) {
        return (
            <View style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (chatVisible && selectedTicket) {
        return (
            <View style={styles.container}>
                <View style={styles.chatHeader}>
                    <TouchableOpacity onPress={() => setChatVisible(false)} style={{ padding: 8 }}>
                        <ChevronLeft color={Colors.textPrimary} size={28} />
                    </TouchableOpacity>
                    <View style={{ flex: 1, marginLeft: 8 }}>
                        <Text style={styles.chatTitle} numberOfLines={1}>{selectedTicket.subject}</Text>
                        <Text style={styles.chatSubtitle}>Ticket #{selectedTicket.id.substring(0,8)} • {selectedTicket.status}</Text>
                    </View>
                </View>

                {loadingMessages ? (
                    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
                        <ActivityIndicator color={Colors.primary} size="large" />
                    </View>
                ) : (
                    <ScrollView contentContainerStyle={styles.chatContent}>
                        {messages.length === 0 ? (
                            <Text style={{ color: Colors.textSecondary, textAlign: 'center', marginTop: 40 }}>No messages yet.</Text>
                        ) : (
                            messages.map((msg: any) => {
                                const isUser = msg.sender === 'User';
                                return (
                                    <View key={msg.id} style={[styles.messageWrapper, isUser ? styles.messageUser : styles.messageAgent]}>
                                        <View style={[styles.messageBubble, isUser ? styles.bubbleUser : styles.bubbleAgent]}>
                                            <Text style={[styles.messageText, isUser ? styles.textUser : styles.textAgent]}>
                                                {msg.message || msg.description}
                                            </Text>
                                            <Text style={[styles.messageTime, isUser ? styles.timeUser : styles.timeAgent]}>
                                                {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                            </Text>
                                        </View>
                                    </View>
                                );
                            })
                        )}
                    </ScrollView>
                )}

                <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
                    <View style={styles.chatInputRow}>
                        <TextInput 
                            style={styles.chatInput}
                            placeholder="Type a message..."
                            placeholderTextColor={Colors.textSecondary}
                            value={replyMessage}
                            onChangeText={setReplyMessage}
                            multiline
                        />
                        <TouchableOpacity 
                            style={[styles.sendBtn, (!replyMessage.trim() || sendingReply) && { opacity: 0.5 }]} 
                            onPress={handleSendReply}
                            disabled={!replyMessage.trim() || sendingReply}
                        >
                            {sendingReply ? <ActivityIndicator color="#000" size="small" /> : <Send color="#000" size={20} />}
                        </TouchableOpacity>
                    </View>
                </KeyboardAvoidingView>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <Header title="Support" subtitle="Help & Desk" />
            
            <ScrollView 
                contentContainerStyle={styles.scrollContent}
                refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />}
            >
                <TouchableOpacity style={styles.createBtn} onPress={() => setSheetVisible(true)}>
                    <View style={styles.createIcon}>
                        <MessageSquare color="#000" size={24} />
                    </View>
                    <Text style={styles.createText}>Raise New Ticket</Text>
                </TouchableOpacity>

                {tickets.length === 0 ? (
                    <View style={styles.emptyState}>
                        <MessageSquare color={Colors.textSecondary} size={32} />
                        <Text style={styles.emptyText}>No support tickets</Text>
                    </View>
                ) : (
                    tickets.map((ticket: any) => (
                        <TouchableOpacity key={ticket.id} onPress={() => openChat(ticket)}>
                            <GlassCard style={styles.ticketCard}>
                                <View style={styles.ticketHeader}>
                                    <Text style={styles.ticketSubject} numberOfLines={1}>{ticket.subject}</Text>
                                    <View style={[styles.badge, { backgroundColor: ticket.status === 'Open' ? 'rgba(59, 130, 246, 0.1)' : 'rgba(34, 197, 94, 0.1)' }]}>
                                        <Text style={[styles.badgeText, { color: ticket.status === 'Open' ? '#3b82f6' : '#22c55e' }]}>
                                            {ticket.status}
                                        </Text>
                                    </View>
                                </View>
                                <Text style={styles.ticketDate}>Opened {new Date(ticket.created_at).toLocaleDateString()} • Tap to view</Text>
                            </GlassCard>
                        </TouchableOpacity>
                    ))
                )}
            </ScrollView>

            <CustomBottomSheet visible={sheetVisible} onClose={() => setSheetVisible(false)} height={500}>
                <View style={styles.sheetHeader}>
                    <Text style={styles.sheetTitle}>New Ticket</Text>
                    <TouchableOpacity onPress={() => setSheetVisible(false)}>
                        <X color={Colors.textSecondary} size={24} />
                    </TouchableOpacity>
                </View>

                <Text style={styles.inputLabel}>Subject</Text>
                <TextInput 
                    style={styles.input} 
                    placeholder="Brief description of your issue" 
                    placeholderTextColor={Colors.textSecondary}
                    value={subject}
                    onChangeText={setSubject}
                />

                <Text style={styles.inputLabel}>Priority</Text>
                <View style={{ flexDirection: 'row', gap: 8, marginBottom: 20 }}>
                    {['Low', 'Normal', 'High', 'Urgent'].map(p => (
                        <TouchableOpacity 
                            key={p} 
                            style={[
                                styles.priorityBtn, 
                                priority === p && styles.priorityBtnActive
                            ]}
                            onPress={() => setPriority(p)}
                        >
                            <Text style={[
                                styles.priorityBtnText, 
                                priority === p && styles.priorityBtnTextActive
                            ]}>
                                {p}
                            </Text>
                        </TouchableOpacity>
                    ))}
                </View>

                <Text style={styles.inputLabel}>Description</Text>
                <TextInput 
                    style={[styles.input, { height: 120, textAlignVertical: 'top' }]} 
                    placeholder="Detailed explanation of the problem..." 
                    placeholderTextColor={Colors.textSecondary}
                    multiline
                    value={description}
                    onChangeText={setDescription}
                />

                <TouchableOpacity 
                    style={[styles.submitBtn, submitting && { opacity: 0.7 }]} 
                    onPress={handleCreateTicket}
                    disabled={submitting}
                >
                    {submitting ? <ActivityIndicator color="#000" /> : (
                        <>
                            <Send color="#000" size={20} />
                            <Text style={styles.submitBtnText}>Submit Ticket</Text>
                        </>
                    )}
                </TouchableOpacity>
            </CustomBottomSheet>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollContent: {
        paddingHorizontal: 24,
        paddingBottom: 40,
    },
    createBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        padding: 20,
        backgroundColor: 'rgba(0, 255, 163, 0.1)', // primary color 10%
        borderRadius: 20,
        marginBottom: 32,
        borderWidth: 1,
        borderColor: 'rgba(0, 255, 163, 0.2)',
    },
    createIcon: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 16,
    },
    createText: {
        color: Colors.primary,
        fontSize: 18,
        fontWeight: '900',
    },
    emptyState: {
        padding: 40,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 20,
    },
    emptyText: {
        color: Colors.textSecondary,
        marginTop: 12,
        fontSize: 14,
        fontWeight: '600',
    },
    ticketCard: {
        padding: 20,
        marginBottom: 16,
    },
    ticketHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 8,
    },
    ticketSubject: {
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '800',
        flex: 1,
        marginRight: 12,
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 8,
    },
    badgeText: {
        fontSize: 10,
        fontWeight: '800',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    ticketDate: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    sheetHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 24,
        marginTop: 10,
    },
    sheetTitle: {
        color: Colors.textPrimary,
        fontSize: 20,
        fontWeight: '900',
    },
    inputLabel: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '700',
        textTransform: 'uppercase',
        marginBottom: 8,
    },
    input: {
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 16,
        paddingHorizontal: 20,
        paddingVertical: 16,
        color: Colors.textPrimary,
        fontSize: 16,
        fontWeight: '600',
        marginBottom: 20,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    priorityBtn: {
        flex: 1,
        paddingVertical: 10,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.1)',
        alignItems: 'center',
    },
    priorityBtnActive: {
        backgroundColor: Colors.primary,
        borderColor: Colors.primary,
    },
    priorityBtnText: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: 'bold',
    },
    priorityBtnTextActive: {
        color: '#000',
    },
    submitBtn: {
        flexDirection: 'row',
        backgroundColor: Colors.primary,
        paddingVertical: 18,
        borderRadius: 16,
        alignItems: 'center',
        justifyContent: 'center',
        marginTop: 10,
        gap: 12,
    },
    submitBtnText: {
        color: '#000',
        fontSize: 16,
        fontWeight: '900',
    },
    
    /* CHAT STYLES */
    chatHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingTop: 50,
        paddingBottom: 20,
        paddingHorizontal: 16,
        backgroundColor: 'rgba(0,0,0,0.5)',
        borderBottomWidth: 1,
        borderBottomColor: 'rgba(255,255,255,0.05)'
    },
    chatTitle: {
        color: Colors.textPrimary,
        fontSize: 18,
        fontWeight: '800',
    },
    chatSubtitle: {
        color: Colors.textSecondary,
        fontSize: 12,
        fontWeight: '600',
    },
    chatContent: {
        paddingHorizontal: 16,
        paddingVertical: 20,
    },
    messageWrapper: {
        marginBottom: 16,
        flexDirection: 'row',
    },
    messageUser: {
        justifyContent: 'flex-end',
    },
    messageAgent: {
        justifyContent: 'flex-start',
    },
    messageBubble: {
        maxWidth: '80%',
        padding: 14,
        borderRadius: 16,
    },
    bubbleUser: {
        backgroundColor: Colors.primary,
        borderBottomRightRadius: 4,
    },
    bubbleAgent: {
        backgroundColor: 'rgba(255,255,255,0.1)',
        borderBottomLeftRadius: 4,
    },
    messageText: {
        fontSize: 15,
        lineHeight: 22,
    },
    textUser: {
        color: '#000',
        fontWeight: '600',
    },
    textAgent: {
        color: Colors.textPrimary,
        fontWeight: '500',
    },
    messageTime: {
        fontSize: 10,
        marginTop: 4,
        alignSelf: 'flex-end',
    },
    timeUser: {
        color: 'rgba(0,0,0,0.5)',
    },
    timeAgent: {
        color: Colors.textSecondary,
    },
    chatInputRow: {
        flexDirection: 'row',
        alignItems: 'flex-end',
        padding: 16,
        backgroundColor: Colors.background,
        borderTopWidth: 1,
        borderTopColor: 'rgba(255,255,255,0.05)',
        marginBottom: 20,
    },
    chatInput: {
        flex: 1,
        backgroundColor: 'rgba(255,255,255,0.05)',
        borderRadius: 20,
        paddingHorizontal: 20,
        paddingTop: 14,
        paddingBottom: 14,
        minHeight: 48,
        maxHeight: 120,
        color: Colors.textPrimary,
        fontSize: 16,
        borderWidth: 1,
        borderColor: 'rgba(255,255,255,0.05)',
    },
    sendBtn: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
        marginLeft: 12,
    }
});
