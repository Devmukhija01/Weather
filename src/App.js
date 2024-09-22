import React, { useState, useEffect } from 'react';
import axios from 'axios';
import './App.css';
import { WiDaySunny, WiCloudy, WiCloud } from 'react-icons/wi';
import { FaBars,FaTimes } from 'react-icons/fa';

function App() {
  const [city, setCity] = useState('');
  const [weather, setWeather] = useState(null);
  const [forecast, setForecast] = useState([]);
  const [unit, setUnit] = useState('metric');
  const [error, setError] = useState(''); 
  const [currentTime, setCurrentTime] = useState(new Date());
  const [darkMode, setDarkMode] = useState(false);
  const [language, setLanguage] = useState('en');
  const [favorites, setFavorites] = useState([]);
  const [showMenu, setShowMenu] = useState(false);

  const apiKey = 'c0241ef9af38020225ed6125f2e63523'; // Replace with your OpenWeather API key

  const fetchWeather = async (city) => {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?q=${city}&appid=${apiKey}&units=${unit}&lang=${language}`);
      setWeather(response.data);
      setError('');
      fetchForecast(response.data.coord.lat, response.data.coord.lon);
      speakWeather(response.data);
      // Remove the line below to prevent automatic opening of the hamburger menu
      // setShowMenu(true);
    } catch (err) {
      setError('City not found. Please try again.');
      setWeather(null);
      setForecast([]);
      // Keep the menu closed in case of an error
      setShowMenu(false);
    }
  };
  

  const fetchForecast = async (lat, lon) => {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/forecast?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}&lang=${language}`);
      const dailyForecast = response.data.list.filter((item) => item.dt_txt.endsWith("12:00:00"));
      setForecast(dailyForecast);
    } catch (err) {
      setError('Error fetching forecast data.');
      setForecast([]);
    }
  };

  const speakWeather = (data) => {
    const speech = new SpeechSynthesisUtterance();
    speech.text = `The weather in ${data.name} is ${data.weather[0].description} with a temperature of ${data.main.temp} degrees.`;
    window.speechSynthesis.speak(speech);
  };

  const handleButtonClick = () => {
    setShowMenu(false); // Close menu on button click
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    fetchWeather(city);
  };
  
  const getCurrentLocationWeather = async () => {
    if (navigator.geolocation) {
      try {
        const position = await new Promise((resolve, reject) => {
          navigator.geolocation.getCurrentPosition(resolve, reject);
        });
        const { latitude, longitude } = position.coords;
        await fetchWeatherByCoords(latitude, longitude);
      } catch (error) {
        setError(getGeolocationError(error));
      }
    } else {
      setError("Geolocation is not supported by this browser.");
    }
  };

  const fetchWeatherByCoords = async (lat, lon) => {
    try {
      const response = await axios.get(`https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${apiKey}&units=${unit}&lang=${language}`);
      setWeather(response.data);
      setError('');
      fetchForecast(lat, lon);
      speakWeather(response.data);
    } catch (err) {
      setError('Unable to fetch weather for your location. Please try again later.');
      setWeather(null);
      setForecast([]);
    }
  };

  const getGeolocationError = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return "Permission denied. Please allow location access.";
      case error.POSITION_UNAVAILABLE:
        return "Location information is unavailable.";
      case error.TIMEOUT:
        return "The request to get user location timed out.";
      case error.UNKNOWN_ERROR:
        return "An unknown error occurred while retrieving location.";
      default:
        return "Error retrieving location.";
    }
  };

  const toggleUnit = () => {
    setUnit(unit === 'metric' ? 'imperial' : 'metric');
    if (weather) {
      fetchWeather(weather.name);
    }
  };

  const handleToggle = () => {
    setDarkMode(!darkMode);
  };

  const handleLanguageChange = (e) => {
    setLanguage(e.target.value);
    if (weather) {
      fetchWeather(weather.name);
    }
  };

  const addFavorite = () => {
    if (city && !favorites.includes(city)) {
      setFavorites([...favorites, city]);
      setCity('');
    }
  };

  const removeFavorite = (city) => {
    setFavorites(favorites.filter(fav => fav !== city));
  };

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (weather) {
      document.body.style.backgroundImage = `url(https://source.unsplash.com/1600x900/?${weather.weather[0].main})`;
    }
  }, [weather]);

  const getWeatherIcon = (description) => {
    switch (description) {
      case 'Clear':
        return <WiDaySunny className="animated-icon" />;
      case 'Rain':
      case 'Drizzle':
      case 'Thunderstorm':
        return <WiCloud className="animated-icon" />;
      case 'Snow':
        return <WiCloud className="animated-icon" />;
      default:
        return <WiCloudy className="animated-icon" />;
    }
  };

  const getWeatherClass = (condition) => {
    switch (condition) {
      case 'Clear':
        return 'clear-sky';
      case 'Scattered Clouds':
        return 'scattered-clouds';
      case 'Overcast Clouds':
        return 'overcast-clouds';
      default:
        return '';
    }
  };

  return (
    <div className={`App ${darkMode ? 'dark-mode' : ''}`}>
      <div className="theme-toggle">
        <input
          type="checkbox"
          id="checkboxInput"
          checked={darkMode}
          onChange={handleToggle}
        />
        <label htmlFor="checkboxInput" className="toggleSwitch"></label>
      </div>

      <h1>Weather App</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter city name"
          value={city}
          onChange={(e) => setCity(e.target.value)}
          required
        />
        <button type="submit">Get Weather</button>
        <button type="button" onClick={getCurrentLocationWeather}>Use Current Location</button>
      </form>

      {error && <p className="error">{error}</p>}
      {weather && (
        <div className={`weather-info ${getWeatherClass(weather.weather[0].main)}`}>
          <h2>{weather.name}</h2>
          <div className="weather-icon">
            {getWeatherIcon(weather.weather[0].main)}
          </div>
          <p>Temperature: {weather.main.temp} °{unit === 'metric' ? 'C' : 'F'}</p>
          <p>Weather: {weather.weather[0].description}</p>
          <p>Humidity: {weather.main.humidity} %</p>
          <p>Wind Speed: {weather.wind.speed} m/s</p>
          <p>Local Time: {currentTime.toLocaleTimeString()}</p>
        </div>
      )}
      {forecast.length > 0 && (
        <div className="forecast">
          <h3>5-Day Forecast</h3>
          {forecast.map((day, index) => (
            <div key={index} className="forecast-day">
              <p>{new Date(day.dt * 1000).toLocaleDateString()}</p>
              <div className="weather-icon">{getWeatherIcon(day.weather[0].main)}</div>
              <p>Temp: {day.main.temp} °{unit === 'metric' ? 'C' : 'F'}</p>
              <p>{day.weather[0].description}</p>
            </div>
          ))}
        </div>
      )}
      {favorites.length > 0 && (
        <div className="favorites">
          <h3>Favorite Locations</h3>
          {favorites.map((fav, index) => (
            <div key={index}>
              <span>{fav}</span>
              <button onClick={() => removeFavorite(fav)}>Remove</button>
            </div>
          ))}
        </div>
      )}

      {/* Hamburger menu */}
      {/* Hamburger menu */}
{weather && (
  <div className="hamburger-menu">
    <FaBars className="hamburger-icon" onClick={() => setShowMenu(!showMenu)} />
    {showMenu && (
      <div className="menu-content">
        <FaTimes className="close-icon" onClick={handleButtonClick} />
        <h3>Features</h3>
        <button onClick={() => { addFavorite(); handleButtonClick(); }}>
          Add to Favorites
        </button>
        <button onClick={() => { toggleUnit(); handleButtonClick(); }}>
          Switch to {unit === 'metric' ? 'Fahrenheit' : 'Celsius'}
        </button>
        <select
          id="language-select"
          value={language}
          onChange={(e) => { handleLanguageChange(e); handleButtonClick(); }}
        >
          <option disabled>--Select Language--</option>
          <option value="en">English</option>
          <option value="es">Spanish</option>
          <option value="fr">French</option>
        </select>
      </div>
    )}
  </div>
)}
    </div>
  );
}

export default App;
