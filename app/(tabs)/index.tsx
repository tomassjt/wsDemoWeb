import React, { useEffect, useState, useRef } from 'react';
import { Image, Platform, StyleSheet, TextInput, Button, TouchableOpacity, View } from 'react-native';
import { HelloWave } from '@/components/hello-wave';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

export default function HomeScreen() {
    const [messages, setMessages] = useState<string[]>([]);
    const [input, setInput] = useState('');
    const [serverIp, setServerIp] = useState('192.168.0.16:8080'); // IP por defecto
    const socket = useRef<WebSocket | null>(null);

    // Estados para controlar acordeones
    const [showConnection, setShowConnection] = useState(false);
    const [showMessages, setShowMessages] = useState(false);

    // Función para conectar al servidor WebSocket
    const connectSocket = () => {
        if (socket.current) {
            socket.current.close(); // cerrar conexión previa si existía
        }

        const url = `ws://${serverIp}`;
        socket.current = new WebSocket(url);

        socket.current.onopen = () => {
            console.log('Conectado al servidor :', url);
            setMessages(prev => [...prev, `Conectado al servidor : ${url}`]);
        };

        socket.current.onmessage = event => {
            let msg = event.data;

            // Si el mensaje viene como ArrayBuffer, decodificamos UTF-8
            if (msg instanceof ArrayBuffer) {
                msg = new TextDecoder('utf-8').decode(msg);
            }

            setMessages(prev => [...prev, `Servidor: ${msg}`]);
        };

        socket.current.onerror = error => {
            console.log('Error Servidor:', error);
            setMessages(prev => [...prev, `Error Servidor: ${error}`]);
        };

        socket.current.onclose = () => {
            console.log('Conexión cerrada');
            setMessages(prev => [...prev, 'Conexión cerrada']);
        };
    };

    const sendMessage = () => {
        if (!socket.current) {
            setMessages(prev => [...prev, 'No hay conexión al servidor']);
            return;
        }

        if (socket.current.readyState !== WebSocket.OPEN) {
            setMessages(prev => [...prev, 'Servidor aún no está abierto o se cerró']);
            return;
        }

        if (input.trim() === '') return;

        socket.current.send(input);
        setMessages(prev => [...prev, `Tú: ${input}`]);
        setInput('');
    };

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={null}
            contentContainerStyle={{ paddingTop: 0 }} // <--- elimina espacio extra arriba
        >
            {/* ACORDEÓN: Configurar Conexión */}
            <TouchableOpacity onPress={() => setShowConnection(!showConnection)}>
                <ThemedView style={[styles.stepContainer, styles.messagesContainer]}>
                    <ThemedText type="subtitle">
                        {showConnection ? '▼ Configurar Conexión' : '▶ Conexión Servidor'}
                    </ThemedText>
                </ThemedView>
            </TouchableOpacity>

            {showConnection && (
                <View>
                    <TextInput
                        style={styles.input}
                        placeholder="IP:Puerto"
                        value={serverIp}
                        onChangeText={setServerIp}
                    />
                    <Button title="Conectar" onPress={connectSocket} />

                    <ThemedText type="subtitle">
                        {showMessages ? '▼ Mensajes Servidor' : '▶ Mensajes Servidor'}
                    </ThemedText>

                    {messages.map((msg, i) => (
                        <ThemedText key={i}>{msg}</ThemedText>
                    ))}

                    <TextInput
                        style={styles.input}
                        placeholder="Escribe un mensaje"
                        value={input}
                        onChangeText={setInput}
                    />
                    <Button title="Enviar al servidor" onPress={sendMessage} />
                </View>
            )}
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    stepContainer: {
        gap: 8,
        marginBottom: 8,
        marginTop: 0, // <--- asegurar que no haya margen arriba
    },
    messagesContainer: {
        borderWidth: 1,
        borderColor: '#888',
        padding: 8,
        marginBottom: 16,
        marginTop: 0, // <--- elimina espacio extra
    },
    input: {
        borderWidth: 1,
        borderColor: '#ccc',
        padding: 8,
        marginVertical: 8,
    },
});
