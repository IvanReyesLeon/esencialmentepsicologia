require('dotenv').config();
const { createTherapist } = require('./models/therapistQueries');
const { pool } = require('./config/db');

const therapists = [
    {
        "fullName": "Yaiza González",
        "label": "Psicóloga especializada en terapia Sistémica-Gestalt y Trauma",
        "bio": "Mi nombre es Yaiza, estoy graduada en psicología y mi número de colegiada es 32113.\n\nMe dedico a acompañar a jóvenes y adultas a través de la psicoterapia integrativa, combinando distintas perspectivas como la sistémica y la gestalt, así como diversas técnicas: constelaciones familiares, técnicas gestálticas, análisis transaccional, movimientos sistémicos, técnicas de respiración y somáticas, artísticas, entre otras.\n\nEstoy formada en trauma, y en el acompañamiento individual que ofrezco está muy presente el trabajo con el sistema de partes internas.",
        "methodology": "Mi intención a través de la práctica profesional es integrar las distintas dimensiones humanas, cómo son el cuerpo, las emociones, la mente, la espiritualidad, la naturaleza, las relaciones interpersonales e intrapersonales.\n\nTe invito a que juntas nos adentremos en el viaje de la autoexploración y el autoconocimiento, de la escucha de las propias necesidades y de lo que el cuerpo nos regala a través de sus somatizaciones, emociones, pensamientos, sueños…\n\nMi propuesta es que contactemos con amabilidad con nuestros pluriversos interiores y creemos un espacio seguro donde poder expresar todo aquello que necesita ser visto, nombrado, gritado y bailado dentro de nosotras.",
        "specialization": [
            "Terapia Sistémica",
            "Gestalt",
            "Trauma",
            "Integrativa"
        ],
        "experience": 5,
        "languages": [
            "Español",
            "Catalán"
        ],
        "sessionTypes": [
            "individual"
        ],
        "photo": "/uploads/terapeutas/yaiza_gonzalez.png",
        "education": [
            {
                "degree": "Grado en Psicología",
                "university": "Universidad Autónoma de Barcelona (UAB)",
                "year": null
            },
            {
                "degree": "Fotografía, Cuerpo y Poder",
                "university": "IEFC",
                "year": null
            },
            {
                "degree": "Posgrado en Pedagogía Sistémica",
                "university": "Institut Integratiu",
                "year": null
            },
            {
                "degree": "Psicoterapia Integradora para el Tratamiento del Trauma",
                "university": "Escuela Eva Molero",
                "year": null
            },
            {
                "degree": "Especialización en Constelaciones Familiares",
                "university": "Institut Integratiu",
                "year": null
            },
            {
                "degree": "Posgrado en Terapia Gestalt Infantil y Adolescente",
                "university": "Institut Integratiu",
                "year": null
            }
        ],
        "license_number": "32113"
    },
    {
        "fullName": "Miriam Expósito",
        "label": "Psicóloga integradora Infantojuvenil y Adultos",
        "bio": "Desde pequeña supe que quería dedicarme a la psicología, con el objetivo de acompañar a las personas en sus procesos de cambio y crecimiento. Siempre me ha interesado comprender cómo pensamos, sentimos y actuamos, y cómo nuestras experiencias moldean quiénes somos.\n\nEsa curiosidad se ha convertido en un compromiso: ofrecer un entorno seguro donde cada persona pueda reconocer sus recursos, aliviar el malestar y fortalecer su manera de relacionarse consigo misma y con los demás.",
        "methodology": "Entiendo la psicoterapia como un camino único para cada persona. Por ello, mi trabajo es integrador, combinando herramientas y técnicas de distintas corrientes psicológicas y adaptándolas a las necesidades específicas de cada proceso y persona.\n\nEn el espacio terapéutico busco generar un espacio de confianza donde explorar pensamientos y emociones sin juicios, acompañando a cada persona a identificar y procesar aquello que le genera malestar con respeto y sensibilidad. Trabajo tanto con población infantojuvenil como con adultos, desde una mirada cercana y comprensiva.",
        "specialization": [
            "Psicología Integradora",
            "Infantojuvenil",
            "Adultos"
        ],
        "experience": 3,
        "languages": [
            "Español",
            "Catalán"
        ],
        "sessionTypes": [
            "individual"
        ],
        "photo": "/uploads/terapeutas/miriam_exposito.png",
        "education": [
            {
                "degree": "Grado en Psicología",
                "university": "Universitat Ramon Llull (URL)",
                "year": null
            },
            {
                "degree": "Máster en Psicología General Sanitaria",
                "university": "Universitat Ramon Llull (URL)",
                "year": null
            },
            {
                "degree": "Curso en Primeros Auxilios Psicológicos (PAP)",
                "university": "Universitat Autònoma de Barcelona (UAB)",
                "year": null
            },
            {
                "degree": "Formación en abordaje y prevención del suicidio",
                "university": "EUNIP",
                "year": null
            }
        ]
    },
    {
        "fullName": "Sonia Montesinos",
        "label": "Psicóloga general sanitaria y Sexóloga",
        "bio": "Desde siempre me ha movido una gran curiosidad por entender cómo pensamos, sentimos y nos relacionamos. Por eso he dedicado mi recorrido profesional a la psicología, formándome y especializándome en diferentes enfoques que me permiten acompañar procesos diversos con profundidad y sensibilidad.\n\nEn consulta, trabajo desde un enfoque integrador, que me permite comprender con una mirada amplia y adaptar el proceso terapéutico a las necesidades de cada persona.",
        "methodology": "Concibo la terapia como un espacio seguro, de confianza y sin juicio, donde podamos co-construir juntas —tú como experta en tu historia, y yo desde el conocimiento psicológico— un camino hacia el bienestar. Acompaño desde la presencia, con una actitud cercana y respetuosa, ofreciendo recursos que te ayuden a comprenderte mejor, gestionar tus emociones y afrontar las dificultades desde un lugar más consciente y compasivo.\n\nMi objetivo es que te sientas acompañada/o en el camino y que juntas podamos encontrar formas de vivir con más equilibrio, bienestar y sentido.",
        "specialization": [
            "Sexología",
            "Violencia de género",
            "Adicciones comportamentales",
            "Trauma"
        ],
        "experience": 5,
        "languages": [
            "Español",
            "Catalán"
        ],
        "sessionTypes": [
            "individual",
            "pareja"
        ],
        "photo": "/uploads/terapeutas/sonia_montesinos.png",
        "license_number": "32420",
        "education": [
            {
                "degree": "Grado de Psicología",
                "university": "Universitat de Barcelona (UB)",
                "year": null
            },
            {
                "degree": "Máster en Sexología Clínica y Terapia de pareja",
                "university": "Universitat de Girona (UdG)",
                "year": null
            },
            {
                "degree": "Máster de Psicología general sanitario",
                "university": "Universitat Ramon Llull (URL)",
                "year": null
            },
            {
                "degree": "Posgrado en adicciones comportamentales",
                "university": "",
                "year": null
            },
            {
                "degree": "Experta en Sexualidades no Normativas",
                "university": "",
                "year": null
            }
        ]
    },
    {
        "fullName": "Mónica Vidal",
        "label": "Psicóloga general sanitaria",
        "bio": "Desde pequeña, he sentido una profunda vocación de apoyo y empatía hacia las personas, lo que me llevó a elegir la psicología como mi camino profesional. Estoy convencida de que acompañar a otros en sus procesos de cambio y crecimiento personal es una de las experiencias más enriquecedoras que existen.\n\nA lo largo de mi formación, me he especializado en áreas clave como la psicología infantojuvenil y familiar, y también trabajo con adultos. Utilizo un enfoque integrador que combina diferentes orientaciones psicológicas, adaptando el proceso terapéutico a las necesidades únicas de cada individuo, y ofreciendo herramientas y estrategias personalizadas.",
        "methodology": "Para mí, la psicología no solo es una profesión, sino una forma de contribuir al bienestar de quienes confían en mí. Mi objetivo es crear un espacio seguro y acogedor en cada sesión, donde mis pacientes se sientan escuchados y comprendidos. Utilizo un enfoque integrador para adaptarme a cada necesidad.",
        "specialization": [
            "Infanto-juvenil",
            "Adultos",
            "Parejas",
            "Trauma y EMDR",
            "Mindfulness"
        ],
        "experience": 6,
        "languages": [
            "Español",
            "Catalán"
        ],
        "sessionTypes": [
            "individual",
            "pareja",
            "familiar"
        ],
        "photo": "/uploads/terapeutas/monica_vidal.png",
        "license_number": "29725",
        "education": [
            {
                "degree": "Grado en Psicología",
                "university": "Universitat Abat Oliba CEU (UAO)",
                "year": null
            },
            {
                "degree": "Máster en Psicología General Sanitaria",
                "university": "UNIR",
                "year": null
            },
            {
                "degree": "Máster en Psicología Clínica",
                "university": "UDIMA",
                "year": null
            },
            {
                "degree": "Especialista Universitario en Trauma y EMDR",
                "university": "UNIR",
                "year": null
            },
            {
                "degree": "Curso Atención Temprana",
                "university": "Universidad de Nebrija",
                "year": null
            },
            {
                "degree": "Experto en Mindfulness",
                "university": "APIR",
                "year": null
            }
        ]
    },
    {
        "fullName": "Sara Ochoa",
        "label": "Psicóloga general sanitaria y Experta en Terapia Sexual",
        "bio": "Soy Sara Ochoa y siempre me han interesado las personas y ayudarlas. Considero que hablar con los demás es lo más enriquecedor que hay y poder ser una herramienta facilitadora de su cambio es una suerte. Por eso decidí estudiar psicología y así hacer de mi día a día un aprendizaje.\n\nAlgo que me caracteriza es que miro a los demás desde una mirada genuina, sin prejuicios, ni juicios de valor y desde una posición de simetría.",
        "methodology": "Siempre he considerado que una correcta aproximación a la terapia debe componerse de más de una metodología. Durante mi grado universitario en la UAB, tuve una formación basada en el método cognitivo-conductual. Posteriormente, me formé en corrientes humanistas e integradoras.\n\nTrabajo desde una perspectiva de género, teniendo muy presente las diversidades sexuales y de género. Opino que la terapia es una herramienta principal para alcanzar el bienestar.",
        "specialization": [
            "Terapia Sexual",
            "Terapia de Pareja",
            "Violencia de género",
            "Diversidad sexual",
            "Adultos",
            "Infantil"
        ],
        "experience": 4,
        "languages": [
            "Español",
            "Catalán"
        ],
        "sessionTypes": [
            "individual",
            "pareja"
        ],
        "photo": "/uploads/terapeutas/sara_ochoa.png",
        "license_number": "M-35448",
        "education": [
            {
                "degree": "Grado en Psicología",
                "university": "Universitat Autònoma de Barcelona (UAB)",
                "year": null
            },
            {
                "degree": "Máster General Sanitario",
                "university": "Madrid",
                "year": null
            },
            {
                "degree": "Especialización en Terapia sexual y de pareja",
                "university": "",
                "year": null
            },
            {
                "degree": "Formación en diversidad sexual y de género",
                "university": "",
                "year": null
            },
            {
                "degree": "Formación en violencia de género",
                "university": "",
                "year": null
            }
        ]
    },
    {
        "fullName": "Joan Miralles",
        "label": "Psicoterapeuta integrativo",
        "bio": "Mi nombre es Joan, psicoterapeuta integrativo y también una persona a la que le apasiona la naturaleza, la escalada y la música. Mi propio proceso de búsqueda cada vez me ha acercado más al mundo de la terapia, del acompañamiento, para encontrar el equilibrio y el camino.\n\nMe esfuerzo en ofrecer un acompañamiento humano, para que podamos transitar juntos esas dificultades, bloqueos o sombras que a veces nos limitan y hacen sufrir.",
        "methodology": "Mi manera de trabajar es horizontal (de tú a tú) y desde la confianza y la seguridad en la relación con el cliente. Mi enfoque integrativo y formación en terapias de tercera generación, mindfulness, EMDR y trauma, nos acompañará a los dos para hacer este apasionante viaje, de manera más fácil, al servicio de que alcances una vida plena y valiosa.",
        "specialization": [
            "Trauma",
            "Problemas relacionales",
            "EMDR",
            "Brainspotting",
            "Mindfulness",
            "Terapias de 3a generación"
        ],
        "experience": 5,
        "languages": [
            "Español",
            "Catalán"
        ],
        "sessionTypes": [
            "individual",
            "grupo"
        ],
        "photo": "/uploads/terapeutas/joan_miralles.png",
        "education": [
            {
                "degree": "Grado de psicología",
                "university": "Universidad Autónoma de Barcelona (UAB)",
                "year": null
            },
            {
                "degree": "Posgrado en Mindfulness y Psicoterapia",
                "university": "IL3 - Universidad de Barcelona (UB)",
                "year": null
            },
            {
                "degree": "Máster en Terapias Contextuales",
                "university": "ISEP",
                "year": null
            },
            {
                "degree": "Curso Trauma emocional y su curación",
                "university": "Fundación Radika",
                "year": null
            },
            {
                "degree": "Formación en Brainspotting",
                "university": "Aleces, institut del trauma",
                "year": null
            }
        ]
    },
    {
        "fullName": "Cèlia Morales Garcia",
        "label": "Psicóloga general sanitaria y Experta en Terapia Sexual",
        "bio": "Mi camino en el mundo de la psicología se inicia ya en la infancia, cuando mi propia historia de vida me lleva a comprender la necesidad de cuidar y dedicarse a la salud mental. La importancia de aprender a trabajar con y de nuestras emociones para vivir de la mejor manera.\n\nApasionada y creativa, mi formación se especializa en la dimensión de la sexualidad y las relaciones de pareja y familia, así como en la psicología clínica.  Desde una perspectiva sistémica necesariamente feminista, concibo la terapia como un espacio de acompañamiento activo.",
        "methodology": "Concibo la terapia como un espacio de acompañamiento activo, en el cual el protagonista único y responsable del cambio es la persona que demanda ayuda. Mi tarea consiste en utilizar las fortalezas que ésta trae consigo de su mismo recorrido vital, así como identificar todo aquello que merece especial atención y trabajo para poder avanzar y alcanzar un mejor funcionamiento en el ámbito personal, familiar y laboral.",
        "specialization": [
            "Terapia Sexual",
            "Terapia de Pareja",
            "TCA",
            "Drogodependencias",
            "Psicología Clínica"
        ],
        "experience": 5,
        "languages": [
            "Español",
            "Catalán"
        ],
        "sessionTypes": [
            "individual",
            "pareja",
            "grupo",
            "familiar"
        ],
        "photo": "/uploads/terapeutas/celia_morales.png",
        "license_number": "29472",
        "education": [
            {
                "degree": "Grado en Psicología",
                "university": "Universidad Ramon Llull, Blanquerna",
                "year": null
            },
            {
                "degree": "Máster en Terapia Sexual y de Pareja",
                "university": "Universidad de Barcelona",
                "year": null
            },
            {
                "degree": "Máster en Psicología General Sanitaria",
                "university": "Universidad Autónoma de Barcelona",
                "year": null
            }
        ]
    }
];

const seed = async () => {
    try {
        console.log(`Starting seed of ${therapists.length} therapists...`);
        for (const t of therapists) {
            console.log(`Creating ${t.fullName}...`);
            const data = {
                full_name: t.fullName,
                label: t.label,
                bio: t.bio,
                methodology: t.methodology,
                specializations: t.specialization,
                experience: t.experience,
                languages: t.languages,
                session_types: t.sessionTypes,
                photo: t.photo,
                education: t.education,
                license_number: t.license_number
            };
            await createTherapist(data);
            console.log(`✓ Created ${t.fullName}`);
        }
        console.log('Seed completed successfully');
        process.exit(0);
    } catch (error) {
        console.error('Seed failed:', error);
        process.exit(1);
    }
};

seed();
