import { useState, useEffect } from "react";

// Swiper imports
import { Swiper, SwiperSlide } from "swiper/react";
import { Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";

/* *** Images *** */

/* Main images */
import mainSunnyCloudy from "./assets/images/main/main-sun-cloud.png";
import mainSunnyCloudyRainImg from "./assets/images/main/main-sun-cloud-angled-rain.png";
import mainNight from "./assets/images/main/main-night.png";

/* Hourly images */
import hourlyDay from "./assets/images/hourly/hourly-day.png";
import hourlyNight from "./assets/images/hourly/hourly-night.png";

/* Forecast images */
import forecastCalendar from "./assets/images/forecast/forecast-calendar.png";
import forecastSun from "./assets/images/forecast/forecast-sun.png";
import forecastRainy from "./assets/images/forecast/forecast-rainy.png";
import forecastSunCloudRain from "./assets/images/forecast/forecast-sun-cloud-rain.png";

/* *** End of images *** */

export default function App() {
  /* Default */

  const defaultCity = "New York";

  /* *** States *** */

  // Starter default stuff
  const [userLocationByIp, setUserLocationByIp] = useState(null);

  // Sets user's location based on their input
  const [userLocation, setUserLocation] = useState(null);
  const [showInput, setShowInput] = useState(false);

  // Sets user's location based on their input
  const [weatherData, setWeatherData] = useState(null);

  const [error, setError] = useState(false);

  // Sets hourly and daily temps and times

  const [hourlyData, setHourlyData] = useState(null);
  const [dailyData, setDailyData] = useState(null);

  /* *** End of states *** */

  // Gets user location by their ip

  async function getUserLocationFromIP() {
    try {
      const res = await fetch("https://geolocation-db.com/json/");
      if (!res.ok) throw new Error("Failed to fetch IP location");

      const data = await res.json();
      setUserLocationByIp(data.country_name);
    } catch (err) {
      setError("IP location failed");
    }
  }

  useEffect(() => {
    getUserLocationFromIP();
  }, []);

  // Fetches data and asign it to weatherData

  async function fetchData(city) {
    try {
      const geoRes = await fetch(
        `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(
          city
        )}&count=1`
      );
      const geoData = await geoRes.json();

      if (!geoData.results || geoData.results.length === 0) {
        setError("City not found!");
        return;
      }

      setError(false);
      const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${geoData.results[0].latitude}&longitude=${geoData.results[0].longitude}&current_weather=true&hourly=temperature_2m,apparent_temperature,relativehumidity_2m,precipitation_probability&daily=temperature_2m_max,temperature_2m_min,precipitation_probability_max&timezone=auto`;
      const weatherRes = await fetch(weatherUrl);
      const weatherData = await weatherRes.json();

      setWeatherData(weatherData);
    } catch (err) {
      setError("Failed to get the data from api");
    }
  }

  useEffect(() => {
    if (userLocation) {
      fetchData(userLocation);
    } else if (userLocationByIp) {
      fetchData(userLocationByIp);
    } else {
      fetchData(defaultCity);
    }
  }, [userLocation, userLocationByIp]);

  /* Gets the name of the current month to be displayed in Today's section */

  function getMonthName() {
    if (!weatherData?.current_weather?.time) return "";
    const d = new Date(weatherData.current_weather.time);
    return `${d.toLocaleDateString(undefined, {
      month: "short",
    })}, ${d.getDate()}`;
  }

  /* Sets the hourly temps and hours using weatherData */

  useEffect(() => {
    if (weatherData) {
      const getCurrentHour = new Date(
        weatherData.current_weather.time
      ).toLocaleTimeString(undefined, {
        hour: "numeric",
        hour12: false,
      });

      const currentHour = Number(getCurrentHour);

      const temps = weatherData.hourly.temperature_2m.slice(
        currentHour + 1,
        currentHour + 14
      );
      const hours = weatherData.hourly.time.slice(
        currentHour + 1,
        currentHour + 14
      );
      const hourlyData = temps.map((value, index) => {
        const timeStr = new Date(hours[index]).toLocaleTimeString(undefined, {
          hour: "numeric",
          hour12: false,
        });
        const isDay = timeStr >= 6 && timeStr <= 18;
        return {
          temp: value,
          time: timeStr,
          isDay: isDay,
        };
      });
      setHourlyData(hourlyData);
    }
  }, [weatherData]);

  /* Sets the forecast section data */

  useEffect(() => {
    if (weatherData) {
      const daysOfWeek = [
        "Sunday",
        "Monday",
        "Tuesday",
        "Wednesday",
        "Thursday",
        "Friday",
        "Saturday",
      ];
      const today = new Date().getDay();
      const maxTemp = weatherData.daily.temperature_2m_max.slice(1);
      const minTemp = weatherData.daily.temperature_2m_min.slice(1);
      const precipitationChance =
        weatherData.daily.precipitation_probability_max.slice(1);

      const dailyData = maxTemp.map((temp, index) => {
        return {
          dayMaxTemp: temp,
          dayMinTemp: minTemp[index],
          dayPrecipitationChance: precipitationChance[index],
          day: daysOfWeek[(today + index + 1) % 7],
        };
      });

      setDailyData(dailyData);
    }
  }, [weatherData]);

  /* Sets the image in forecast section based on dayPrecipitationChance in dailyData */

  function getForecastIcon(rainProb) {
    if (rainProb >= 60) {
      return forecastRainy;
    } else if (rainProb >= 30) {
      return forecastSunCloudRain;
    } else {
      return forecastSun;
    }
  }

  /* Sets main image based on weather and time of day */

  function handleMainImg() {
    if (document.body.classList.contains("rainy-weather")) {
      return mainSunnyCloudyRainImg;
    }
    if (document.body.classList.contains("night")) {
      return mainNight;
    } else {
      return mainSunnyCloudy;
    }
  }

  /* Reset if api failed */

  function resetDataSearch() {
    setShowInput(false);
    setUserLocation(null);

    const cityToFetch = userLocationByIp || defaultCity;

    fetchData(cityToFetch);
  }

  /* Sets the body's className */

  useEffect(() => {
    if (!weatherData) return;

    const currentHour = new Date().getHours();
    const isNight = currentHour > 17 || currentHour < 6;
    const isRainy = weatherData.daily.precipitation_probability_max[0] > 60;

    document.body.classList.toggle("night", isNight);
    document.body.classList.toggle("day", !isNight);
    document.body.classList.toggle("rainy-weather", isRainy);
  }, [weatherData]);

  return (
    <>
      {error && (
        <>
          <section className="error-page">
            <h2>{error}</h2>
            <button onClick={resetDataSearch}>Try Again</button>
          </section>
        </>
      )}
      {!weatherData && !error ? <h2 className="loading">Loading ...</h2> : null}
      {weatherData && !error ? (
        <section className="main-page">
          {/* User location input */}

          <header>
            <section className="user-location-display">
              {!showInput ? (
                <button
                  onClick={() => setShowInput(true)}
                  className="user-location-button"
                >
                  <span className="icon-before" />
                  {weatherData
                    ? userLocation
                      ? weatherData.timezone?.split("/")[1] || ""
                      : (userLocationByIp?.charAt(0).toUpperCase() || "") +
                        (userLocationByIp?.slice(1) || "")
                    : ""}
                  <span className="icon-after" />
                </button>
              ) : (
                <form
                  className="user-location-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    const userValue = e.target.elements.location.value;
                    if (userValue.trim() === "") return;
                    setUserLocation(userValue.trim());
                    setShowInput(false);
                  }}
                >
                  <input
                    type="text"
                    name="location"
                    className="user-location-input"
                    placeholder="Enter location..."
                    autoFocus
                  />
                  <button
                    type="submit"
                    className="submit-icon"
                    aria-label="Search"
                  >
                    🔍
                  </button>
                </form>
              )}
            </section>
          </header>

          <main>
            {/* Main data Section */}

            <section className="weather-main-data">
              <img
                src={handleMainImg()}
                alt="sunny cloudy image"
                draggable="false"
              />
              <h1 className="current-tempature">
                {weatherData.current_weather.temperature}º
              </h1>
              <span className="weather-min-max">
                <span>
                  Max.: {weatherData.daily.temperature_2m_max[0]}º Min.:{" "}
                  {weatherData.daily.temperature_2m_min[0]}º
                </span>
              </span>
            </section>

            {/* Quick stats Section */}

            <section className="quick-stats">
              <span className="stats-precipitation">
                {
                  weatherData.hourly.precipitation_probability[
                    new Date().getHours()
                  ]
                }
                %
              </span>
              <span className="stats-humidity">
                {weatherData.hourly.relativehumidity_2m[new Date().getHours()]}%
              </span>
              <span className="stats-wind">
                {weatherData.current_weather.windspeed} km/h
              </span>
            </section>

            {/* Today section */}
            <section className="today-data">
              <section className="today-header">
                <h3>Today</h3>
                <time dateTime={weatherData.current_weather.time}>
                  {getMonthName()}
                </time>
              </section>
              <section className="today-data-showcase">
                <Swiper
                  key={userLocation}
                  modules={[Pagination]}
                  pagination={{ clickable: true }}
                  spaceBetween={16}
                  slidesPerView={2}
                  touchReleaseOnEdges={true}
                  breakpoints={{
                    300: {
                      slidesPerView: 3,
                    },
                    450: {
                      slidesPerView: 4,
                    },
                    650: {
                      slidesPerView: 5,
                    },
                    1024: {
                      slidesPerView: 6,
                    },
                  }}
                >
                  {hourlyData?.map((data, index) => (
                    <SwiperSlide key={index}>
                      <section className="today-single-data">
                        <span className="today-hourly-temp">{data.temp}°C</span>
                        <img
                          src={data.isDay ? hourlyDay : hourlyNight}
                          alt="hourly weather image"
                        />
                        <span className="today-hourly-time">
                          {`${data.time}:00`}
                        </span>
                      </section>
                    </SwiperSlide>
                  ))}
                </Swiper>
              </section>
            </section>

            {/* Forecast Section */}
            <section className="forecast-data">
              <section className="forecast-data-header">
                <h3>Next Forecast</h3>
                <img
                  src={forecastCalendar}
                  alt="calendar image"
                  draggable="false"
                />
              </section>
              <section className="forecast-data-main">
                {dailyData &&
                  dailyData.map((data, index) => {
                    return (
                      <section key={index} className="forecast-data-single">
                        <h4>{data.day}</h4>
                        <img
                          src={getForecastIcon(data.dayPrecipitationChance)}
                          draggable="false"
                        />
                        <p>
                          <span className="forecast-max">
                            {Number(data.dayMaxTemp).toFixed(0)}
                          </span>{" "}
                          <span className="forecast-min">
                            {Number(data.dayMinTemp).toFixed(0)}
                          </span>
                        </p>
                      </section>
                    );
                  })}
              </section>
            </section>
          </main>
          <footer className="signature">
            © 2025 Mohammad Rasooli
            <br />
            Version 1.0.3
          </footer>
        </section>
      ) : null}
    </>
  );
}
