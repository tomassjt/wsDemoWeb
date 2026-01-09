import React, { useEffect, useState, useRef } from 'react';
import { StyleSheet, TextInput, Button, TouchableOpacity, View, FlatList } from 'react-native';
import ParallaxScrollView from '@/components/parallax-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';

interface Product {
  id: number;
  name: string;
  price: number;
}

export default function HomeScreen() {
  const [messages, setMessages] = useState<string[]>([]);
  const [serverIp, setServerIp] = useState('192.168.0.16:8080');
  const socket = useRef<WebSocket | null>(null);

  // Estados para controlar acordeones
  const [showConnection, setShowConnection] = useState(false);
  const [showMessages, setShowMessages] = useState(false);

  // Estado de producto actual a agregar
  const [productName, setProductName] = useState('');
  const [productPrice, setProductPrice] = useState('');
  const [products, setProducts] = useState<Product[]>([]);

  // ===========================
  // Conectar al WebSocket
  // ===========================
  const connectSocket = () => {
    if (socket.current) socket.current.close();

    const url = `ws://${serverIp}`;
    socket.current = new WebSocket(url);

    socket.current.onopen = () => {
      setMessages(prev => [...prev, `Conectado al servidor: ${url}`]);
      syncProducts(); // pedir lista inicial al conectarse
    };

    socket.current.onmessage = event => {
      let msg = event.data;
      if (msg instanceof ArrayBuffer) msg = new TextDecoder('utf-8').decode(msg);

      try {
        const data = JSON.parse(msg);

        if (data.type === 'syncProducts') {
          // Reemplazar lista completa de productos
          setProducts(data.products);
          setMessages(prev => [...prev, 'Lista de productos sincronizada']);
        } else if (data.type === 'addProduct') {
          // Recibir producto agregado por otros clientes
          setProducts(prev => [...prev, data.product]);
          setMessages(prev => [...prev, `Producto agregado: ${data.product.name}`]);
        } else {
          setMessages(prev => [...prev, `Servidor: ${msg}`]);
        }
      } catch (e) {
        setMessages(prev => [...prev, `Servidor: ${msg}`]);
      }
    };

    socket.current.onerror = error => {
      setMessages(prev => [...prev, `Error Servidor: ${error}`]);
    };

    socket.current.onclose = () => {
      setMessages(prev => [...prev, 'Conexión cerrada']);
    };
  };

  // ===========================
  // Enviar producto al servidor
  // ===========================
  const sendProduct = () => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) {
      setMessages(prev => [...prev, 'No hay conexión al servidor']);
      return;
    }

    if (!productName || !productPrice) return;

    const newProduct: Product = {
      id: Date.now(),
      name: productName,
      price: parseFloat(productPrice),
    };

    // Enviar JSON al servidor
    socket.current.send(JSON.stringify({ type: 'addProduct', product: newProduct }));

    // Guardar localmente para mostrar en la UI
    setProducts(prev => [...prev, newProduct]);
    setMessages(prev => [...prev, `Producto enviado: ${newProduct.name}`]);

    // Limpiar inputs
    setProductName('');
    setProductPrice('');
  };

  // ===========================
  // Sincronizar lista de productos
  // ===========================
  const syncProducts = () => {
    if (!socket.current || socket.current.readyState !== WebSocket.OPEN) return;
    socket.current.send(JSON.stringify({ type: 'getProducts' }));
  };

  // ===========================
  // Intervalo de sincronización cada 5 minutos
  // ===========================
  useEffect(() => {
    const interval = setInterval(syncProducts, 5 * 60 * 1000); // 5 minutos
    return () => clearInterval(interval);
  }, []);

  // ===========================
  // Render
  // ===========================
  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={null}
      contentContainerStyle={{ paddingTop: 0 }}
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

          {/* Inputs para agregar producto */}
          <TextInput
            style={styles.input}
            placeholder="Nombre del producto"
            value={productName}
            onChangeText={setProductName}
          />
          <TextInput
            style={styles.input}
            placeholder="Precio"
            value={productPrice}
            onChangeText={setProductPrice}
            keyboardType="numeric"
          />
          <Button title="Enviar Producto" onPress={sendProduct} />

          {/* Lista de productos agregados */}
          <ThemedText type="subtitle" style={{ marginTop: 16 }}>
            Productos agregados:
          </ThemedText>
          <FlatList
            data={products}
            keyExtractor={item => item.id.toString()}
            renderItem={({ item }) => (
              <ThemedView style={styles.productCard}>
                <ThemedText>{item.name}</ThemedText>
                <ThemedText>${item.price.toFixed(2)}</ThemedText>
              </ThemedView>
            )}
          />
        </View>
      )}
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  stepContainer: {
    gap: 8,
    marginBottom: 8,
    marginTop: 0,
  },
  messagesContainer: {
    borderWidth: 1,
    borderColor: '#888',
    padding: 8,
    marginBottom: 16,
    marginTop: 0,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    padding: 8,
    marginVertical: 8,
  },
  productCard: {
    padding: 8,
    borderWidth: 1,
    borderColor: '#aaa',
    borderRadius: 6,
    marginBottom: 8,
  },
});
