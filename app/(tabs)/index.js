import { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Button, FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
// Importamos nuestra configuración de Firebase
import { auth, db } from '../../firebaseConfig';
// Importamos las funciones de autenticación
import {
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signOut,
} from 'firebase/auth';
// Importamos las funciones de la base de datos (Firestore)
import { addDoc, collection, getDocs, query, where } from 'firebase/firestore';

// ---------------------------------------------------
// ¡¡IMPORTANTE!! Pega tu API Key de OpenWeatherMap aquí
// ---------------------------------------------------
const OPENWEATHER_API_KEY = '77ef2902a2a84b2c86752ff5ac429d63';
// ---------------------------------------------------

export default function App() {
  // --- Estados de Autenticación ---
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [user, setUser] = useState(null); // ¿Hay un usuario logueado?
  const [loading, setLoading] = useState(true); // Para la pantalla de carga inicial

  // --- Estados de la App (Clima) ---
  const [city, setCity] = useState(''); // Para el buscador de clima
  const [weather, setWeather] = useState(null); // Para guardar el resultado de la API
  const [favorites, setFavorites] = useState([]); // Para la lista de favoritos de Firestore
  const [loadingWeather, setLoadingWeather] = useState(false); // Para el indicador de carga del clima

  // --- EFECTO 1: Observador de Autenticación ---
  // Esto se ejecuta UNA VEZ al cargar la app
  // Revisa si el usuario ya tenía una sesión iniciada
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
      if (currentUser) {
        // Si el usuario existe, cargamos sus favoritos
        fetchFavorites(currentUser.uid);
      }
    });
    return () => unsubscribe(); // Limpia el observador al desmontar
  }, []);

  // --- FUNCIONES DE AUTENTICACIÓN (Seguridad) ---
  const handleSignUp = () => {
    createUserWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        Alert.alert('¡Éxito!', 'Usuario creado correctamente.');
      })
      .catch((error) => Alert.alert('Error', error.message));
  };

  const handleLogin = () => {
    signInWithEmailAndPassword(auth, email, password)
      .then((userCredential) => {
        Alert.alert('¡Bienvenido!', 'Sesión iniciada.');
      })
      .catch((error) => Alert.alert('Error', error.message));
  };

  const handleLogout = () => {
    signOut(auth).catch((error) => Alert.alert('Error', error.message));
    setFavorites([]); // Limpiamos los favoritos al salir
  };

  // --- FUNCIONES DE API DE TERCEROS (OpenWeatherMap) ---
  const fetchWeather = () => {
    if (city.trim() === '') {
      Alert.alert('Error', 'Por favor, escribe una ciudad.');
      return;
    }
    setLoadingWeather(true);
    setWeather(null);
    const url = `https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${OPENWEATHER_API_KEY}&units=metric&lang=es`;
    
    fetch(url)
      .then((response) => response.json())
      .then((data) => {
        if (data.cod !== 200) {
          Alert.alert('Error', data.message || 'Ciudad no encontrada.');
        } else {
          setWeather(data);
        }
        setLoadingWeather(false);
      })
      .catch((error) => {
        Alert.alert('Error', 'No se pudo conectar con la API.');
        setLoadingWeather(false);
      });
  };

  // --- FUNCIONES DE SERVICIOS EN LA NUBE (Firestore) ---
  const fetchFavorites = async (uid) => {
    // 1. Apuntamos a la colección "favorites"
    const q = query(collection(db, 'favorites'), where('userId', '==', uid));
    
    // 2. Obtenemos los documentos
    const querySnapshot = await getDocs(q);
    const favs = [];
    querySnapshot.forEach((doc) => {
      favs.push({ id: doc.id, ...doc.data() });
    });
    setFavorites(favs); // 3. Actualizamos el estado
  };

  const addFavorite = async () => {
    if (!weather) {
      Alert.alert('Error', 'Busca un clima primero para añadirlo a favoritos.');
      return;
    }
    // Añade un documento a la colección "favorites"
    try {
      await addDoc(collection(db, 'favorites'), {
        userId: user.uid, // Guardamos el ID del usuario para seguridad
        cityName: weather.name,
        temp: weather.main.temp,
      });
      Alert.alert('¡Éxito!', `${weather.name} añadido a favoritos.`);
      fetchFavorites(user.uid); // Recargamos la lista
    } catch (e) {
      Alert.alert('Error', 'No se pudo guardar el favorito.');
    }
  };


  // --- PANTALLA DE CARGA ---
  if (loading) {
    return (
      <View style={styles.container}>
        <ActivityIndicator size="large" />
        <Text>Cargando...</Text>
      </View>
    );
  }

  // --- PANTALLA DE LOGIN / REGISTRO ---
  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Mi Clima App</Text>
        <TextInput
          style={styles.input}
          placeholder="Email"
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
        />
        <TextInput
          style={styles.input}
          placeholder="Contraseña"
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <View style={styles.buttonContainer}>
          <Button title="Iniciar Sesión" onPress={handleLogin} />
          <Button title="Registrarse" onPress={handleSignUp} />
        </View>
      </View>
    );
  }

  // --- PANTALLA PRINCIPAL DE LA APP (Logueado) ---
  return (
    <View style={styles.container}>
      <Text style={styles.title}>¡Hola, {user.email}!</Text>
      
      {/* Sección 1: Buscador de Clima (API de Terceros) */}
      <Text style={styles.subtitle}>Buscar Clima</Text>
      <TextInput
        style={styles.input}
        placeholder="Escribe una ciudad (ej. Monterrey)"
        value={city}
        onChangeText={setCity}
      />
      <Button title="Buscar" onPress={fetchWeather} />

      {/* Resultado del Clima */}
      {loadingWeather && <ActivityIndicator size="small" style={{ marginVertical: 10 }} />}
      {weather && (
        <View style={styles.weatherBox}>
          <Text style={styles.weatherCity}>{weather.name}</Text>
          <Text style={styles.weatherTemp}>{weather.main.temp.toFixed(1)}°C</Text>
          <Text style={styles.weatherDesc}>{weather.weather[0].description}</Text>
          <Button title="Añadir a Favoritos" onPress={addFavorite} />
        </View>
      )}

      {/* Sección 2: Favoritos (Servicios en la Nube) */}
      <Text style={styles.subtitle}>Mis Ciudades Favoritas</Text>
      <FlatList
        data={favorites}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <View style={styles.favoriteItem}>
            <Text>{item.cityName}</Text>
            <Text>{item.temp.toFixed(1)}°C</Text>
          </View>
        )}
        ListEmptyComponent={<Text>No tienes favoritos guardados.</Text>}
      />

      <Button title="Cerrar Sesión" onPress={handleLogout} />
    </View>
  );
}

// --- ESTILOS ---
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f0f4f7',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
    paddingTop: 60,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 20,
  },
  subtitle: {
    fontSize: 20,
    fontWeight: '600',
    marginTop: 20,
    marginBottom: 10,
    alignSelf: 'flex-start',
  },
  input: {
    width: '100%',
    height: 40,
    borderColor: 'gray',
    borderWidth: 1,
    borderRadius: 5,
    paddingHorizontal: 10,
    marginBottom: 10,
    backgroundColor: '#fff',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
  },
  weatherBox: {
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    marginVertical: 15,
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  weatherCity: {
    fontSize: 22,
    fontWeight: 'bold',
  },
  weatherTemp: {
    fontSize: 36,
    fontWeight: '200',
    marginVertical: 5,
  },
  weatherDesc: {
    fontSize: 16,
    textTransform: 'capitalize',
    marginBottom: 10,
  },
  favoriteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    padding: 10,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
});
