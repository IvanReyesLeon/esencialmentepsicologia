import React, { useState, useEffect } from 'react';
import './Reviews.css';

const Reviews = () => {
  // Todas las reseñas reales de Google
  const allReviews = [
    {
      id: 1,
      name: "Ely Lozano",
      rating: 5,
      comment: "Me siento muy agradecida por el apoyo y la ayuda que he recibido de Yaiza durante un momento difícil en mi vida. Su capacidad para escuchar y comprender mis sentimientos es brutal, atenta la verdad es que me siento escuchada, y muy cómoda.",
      date: "Hace 6 días"
    },
    {
      id: 2,
      name: "Melani Mateos Blanco",
      rating: 5,
      comment: "Este año decidí acudir a Esencialmente Psicología por un problema personal. Era la primera vez que acudía a un psicólogo y tenía miedo de qué profesional me iban a asignar, si sería capaz de abrirme y contarle mis cosas. Ha sido una experiencia muy positiva.",
      date: "Hace 1 mes"
    },
    {
      id: 3,
      name: "Lorena Mate Sarrion",
      rating: 5,
      comment: "Estoy muy feliz de haber encontrado este centro y en especial a Mónica. Me siento cómoda y libre de ser yo misma y hablar desde la honestidad. Es muy notable el cariño y tiempo que le pone tanto Anna para ayudarte a encontrar al mejor profesional.",
      date: "Hace 5 meses"
    },
    {
      id: 4,
      name: "Claudia Tesán",
      rating: 5,
      comment: "Tras una mala experiencia en otro centro psicológico, Esencialmente gracias a su gran equipo de profesionales y sobre todo gracias a mi psicóloga Mónica, ha cambiado totalmente mi percepción sobre la terapia. Estoy muy contenta y mejorando.",
      date: "Hace 4 meses"
    },
    {
      id: 5,
      name: "Lucia Perez Lopez",
      rating: 5,
      comment: "Tras varios intentos, a día de hoy, puedo decir bien alto y claro, que he encontrado a alguien que se está volviendo un lugar seguro, ella es Mònica, mi psicóloga. Quiero agradecer-le toda su empatía, profesionalidad y compromiso diario.",
      date: "Hace 5 meses"
    },
    {
      id: 6,
      name: "Raquel Menéndez Pasamontes",
      rating: 5,
      comment: "En enero comencé por primera vez a ir al psicólogo por un cambio importante en mi vida, y llegó Célia y me cambió la visión global, he aprendido, he crecido y a día de hoy quiero seguir haciéndolo a su lado, 100% recomendable!",
      date: "Hace 5 meses"
    },
    {
      id: 7,
      name: "Yasmina Paroj",
      rating: 5,
      comment: "Encantada con el trato y la transparencia que han tenido Anna y Mónica con mi hija. Nos están ayudando muchísimo y nos hacen sentir como en casa. Se nota que les gusta su trabajo por su cercanía y profesionalidad. Las recomendaría 100%.",
      date: "Hace 8 meses"
    },
    {
      id: 8,
      name: "Anónimo",
      rating: 5,
      comment: "Estuve casi 2 años de terapia con Lorena y no puedo estar mas contento. Me ha ayudado a superar muchos obstáculos y siempre con una actitud muy profesional y cercana.",
      date: "Hace 1 año"
    },
    {
      id: 9,
      name: "Anónimo",
      rating: 5,
      comment: "Profesionalidad increíble y un cuidado y una atención inmejorable. Desde el primer día te hacen sentir en un espacio seguro.",
      date: "Hace 1 año"
    },
    {
      id: 10,
      name: "Anónimo",
      rating: 5,
      comment: "Anna es una gran profesional con la que llevo varios meses visitándome. Su dedicación y compromiso son excepcionales.",
      date: "Hace 1 año"
    },
    {
      id: 11,
      name: "Laia Barbero Lop",
      rating: 5,
      comment: "Hace 1 año que empecé a ir a este centro de psicología y desde mi primer contacto fueron encantadoras, me ayudaron en todas mis dudas y en apenas 1 semana ya tenía asignada mi primera cita con Sara. Estoy muy agradecida por todo el apoyo recibido.",
      date: "Hace 8 meses"
    },
    {
      id: 12,
      name: "Ruben Mayo",
      rating: 5,
      comment: "Estoy encantadísimo con Anna y con Mónica por su gran profesionalidad y especialmente por el trato recibido. Han tenido un tacto muy especial, han sido súper amables y cariñosas con la peque! Espero poder seguir disfrutando de esta confianza que me dan ellas 2 por muchos años más.",
      date: "Hace 8 meses"
    },
    {
      id: 13,
      name: "Noelia Sánchez",
      rating: 5,
      comment: "Totalmente recomendable! En función del tema por el que contactas Anna te asigna un profesional u otro, y siempre aciertan. Me he sentido muy bien atendida y acompañada durante todo el proceso.",
      date: "Hace 1 año"
    },
    {
      id: 14,
      name: "Cristina B",
      rating: 5,
      comment: "He estado mucho tiempo haciendo sesiones online con Anna y me han ayudado mucho. Hoy tengo las herramientas para poder afrontar cosas que antes me parecían imposibles. He podido entender mi ansiedad, incluso pasar un proceso de duelo de manera más saludable.",
      date: "Hace 10 meses"
    },
    {
      id: 15,
      name: "Nerea Gil González",
      rating: 5,
      comment: "Muy contenta con Mònica! Es una gran profesional que se interesa por el bienestar de sus pacientes. Además, es también muy cercana y eso te hace sentir más acompañada. La recomiendo mucho!",
      date: "Hace 7 meses"
    },
    {
      id: 16,
      name: "M Garcia",
      rating: 5,
      comment: "Estoy encantado con Joan, me está ayudando desde el primer momento que entré en su sala. Es muy grande. Transmite mucha paz y serenidad. Te escucha e intenta entender lo que necesitas en cada momento.",
      date: "Hace 10 meses"
    },
    {
      id: 17,
      name: "Roberto Irigoyen López",
      rating: 5,
      comment: "Ya llevo 2 años o más con Christian y la verdad es que me ha ayudado mucho, yo antes tenía un manojo de problemas y poco a poco he ido consiguiendo salir. Incluso hace poco le dije que ya volvía a ser feliz. Pocas palabras bastan para indicar cuan agradecido estoy.",
      date: "Hace 7 meses"
    },
    {
      id: 18,
      name: "Kevin Pérez Rodríguez",
      rating: 5,
      comment: "El centro de psicología es un espacio cálido, profesional y acogedor. Desde el momento en que entras, sientes una atmósfera de tranquilidad y empatía. Joan es un gran profesional, me hizo sentir escuchado y comprendido desde la primera sesión. Gracias a su ayuda, he logrado avances significativos en mi bienestar emocional.",
      date: "Hace 10 meses"
    }
  ];

  // Función para mezclar el array de forma aleatoria (Fisher-Yates shuffle)
  const shuffleArray = (array) => {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  };

  // Estado para las reseñas a mostrar (6 aleatorias en PC, 3 en móvil)
  const [reviews, setReviews] = useState([]);

  useEffect(() => {
    // Seleccionar 6 reseñas aleatorias al cargar el componente
    const shuffled = shuffleArray(allReviews);
    setReviews(shuffled.slice(0, 6));
  }, []);

  const renderStars = (rating) => {
    return Array.from({ length: 5 }, (_, index) => (
      <span key={index} className={`star ${index < rating ? 'filled' : ''}`}>
        ★
      </span>
    ));
  };

  return (
    <div className="reviews-section">
      <div className="container">
        <h2>Lo que dicen nuestros pacientes</h2>
        <div className="reviews-grid">
          {reviews.map((review, index) => (
            <div
              key={review.id}
              className={`review-card ${index >= 3 ? 'hide-mobile' : ''}`}
            >
              <div className="review-header">
                <div className="reviewer-info">
                  <h4>{review.name}</h4>
                  <div className="rating">
                    {renderStars(review.rating)}
                  </div>
                </div>
                <span className="review-date">{review.date}</span>
              </div>
              <p className="review-comment">"{review.comment}"</p>
            </div>
          ))}
        </div>
        <div className="reviews-cta">
          <p>¿Has tenido una experiencia positiva con nosotros?</p>
          <a
            href="https://www.google.com/search?sca_esv=07ce68c0b2639d03&sxsrf=AE3TifPXZc9AxK1MUVQk9IkgfhRyLiZekw:1764926434386&si=AMgyJEtREmoPL4P1I5IDCfuA8gybfVI2d5Uj7QMwYCZHKDZ-E1x3gSkpdQGdeGlfG_671lPyExp8kcTGghJOmk4tjkQ38tfFw2kdUDG_xZEBSyQOpCJvK-aErGx25lQRDUsSIIdEaNw1Zm315cO85gQytKuyZrf_QSLZK79jlJT_1YZf63abMXU%3D&q=Esencialmente+Psicolog%C3%ADa+-+Anna+Becerra+Rese%C3%B1as&sa=X&ved=2ahUKEwj2mrSpj6aRAxXp0AIHHXVqPdUQ0bkNegQIJBAE"
            target="_blank"
            rel="noopener noreferrer"
            className="btn-primary"
          >
            Deja tu reseña
          </a>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
