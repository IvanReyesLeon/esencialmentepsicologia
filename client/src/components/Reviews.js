import React from 'react';
import './Reviews.css';

const Reviews = () => {
  const reviews = [
    {
      id: 1,
      name: "María González",
      rating: 5,
      comment: "Anna es una profesional excepcional. Me ha ayudado enormemente en mi proceso de crecimiento personal. Su enfoque empático y profesional hace que te sientas cómoda desde el primer momento.",
      date: "Hace 2 semanas"
    },
    {
      id: 2,
      name: "Carlos Martín",
      rating: 5,
      comment: "Excelente experiencia en terapia de pareja. Anna nos proporcionó herramientas muy útiles para mejorar nuestra comunicación. Totalmente recomendable.",
      date: "Hace 1 mes"
    },
    {
      id: 3,
      name: "Laura Pérez",
      rating: 5,
      comment: "Un espacio seguro donde poder expresarme sin juicios. Anna tiene una gran capacidad para escuchar y guiar el proceso terapéutico de manera muy profesional.",
      date: "Hace 1 mes"
    },
    {
      id: 4,
      name: "David Rodríguez",
      rating: 5,
      comment: "Después de varios meses de terapia puedo decir que ha sido una de las mejores decisiones que he tomado. Anna es muy profesional y cercana a la vez.",
      date: "Hace 2 meses"
    }
  ];

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
          {reviews.map((review) => (
            <div key={review.id} className="review-card">
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
          <button className="btn-primary">Deja tu reseña</button>
        </div>
      </div>
    </div>
  );
};

export default Reviews;
