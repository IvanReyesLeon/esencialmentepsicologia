/**
 * Contenido editorial de cada especialidad para /especialidades/:slug.
 * Cumple YMYL: sin promesas de resultados, sin autodiagnóstico, sin datos clínicos inventados.
 * La información dinámica (precio/duración de una tarifa) NUNCA vive aquí — ver SpecialtyPage + pricingAPI.
 */

export const specialtiesData = {
  "traumas-y-fobias": {
    heading: "Terapia para traumas y fobias",
    subtitle: "Un espacio para procesar experiencias difíciles y miedos intensos que condicionan tu día a día.",
    directAnswer: "La terapia para traumas y fobias trabaja experiencias pasadas que siguen generando malestar en el presente, o miedos intensos y desproporcionados ante situaciones concretas, con el objetivo de recuperar seguridad y bienestar.",
    whatIsTitle: "¿Qué diferencia hay entre un trauma y una fobia?",
    whatIsText: "Un trauma psicológico surge de una experiencia vivida como amenazante o desbordante, cuyo impacto emocional persiste en el tiempo. Una fobia es un miedo intenso y persistente hacia un objeto, situación o actividad concreta, que lleva a evitarla activamente. Ambos pueden abordarse en psicoterapia, y en ocasiones están relacionados entre sí.",
    whenTitle: "¿Cuándo puede ser útil buscar apoyo psicológico?",
    whenText: "Cuando un recuerdo, situación o miedo concreto sigue interfiriendo en tu vida cotidiana, tus relaciones o tu tranquilidad, y notas que por ti mismo/a te cuesta gestionarlo. La valoración profesional ayuda a entender qué está ocurriendo y qué opciones de abordaje existen para tu caso concreto.",
    howTitle: "¿Cómo se trabaja en consulta?",
    howText: "El proceso comienza con una valoración inicial para entender tu situación y tus objetivos. A partir de ahí, se plantea un abordaje terapéutico ajustado a tu ritmo, que puede incluir, entre otras herramientas, terapia EMDR cuando el profesional lo considere indicado tras la valoración.",
    onlineText: "Esta especialidad puede trabajarse en modalidad online por videollamada, manteniendo la confidencialidad y el rigor clínico, para personas de cualquier punto de España.",
    presentialText: "También ofrecemos atención presencial en nuestro centro de Cerdanyola del Vallès, accesible desde Barcelona y el Vallès Occidental.",
    faqs: [
      { question: "¿La terapia elimina completamente el miedo o el recuerdo traumático?", answer: "El objetivo de la terapia es ayudarte a procesar la experiencia y reducir el malestar asociado, no borrar el recuerdo. Los resultados varían según cada persona y situación, y se valoran de forma individualizada en consulta." },
      { question: "¿Se puede trabajar una fobia concreta de forma online?", answer: "En muchos casos sí, aunque la idoneidad de la modalidad online se valora en la primera consulta según las características de cada situación." },
      { question: "¿Cuánto dura este tipo de proceso terapéutico?", answer: "La duración depende de cada caso y se define junto con el profesional tras la valoración inicial; no existe un número de sesiones estándar aplicable a todas las personas." }
    ],
    relatedSlugs: ["emdr", "ansiedad-y-depresion"]
  },

  "adicciones": {
    heading: "Terapia psicológica para adicciones",
    subtitle: "Acompañamiento psicológico ante conductas adictivas, con respeto y sin juicios.",
    directAnswer: "La atención psicológica en adicciones ofrece un espacio de acompañamiento para entender y abordar una conducta adictiva, sus causas y su impacto en tu vida, siempre de forma coordinada con otros recursos médicos o especializados cuando sean necesarios.",
    whatIsTitle: "¿Qué abarca la atención psicológica en adicciones?",
    whatIsText: "Puede incluir tanto adicciones a sustancias como conductas adictivas sin sustancia (por ejemplo, relacionadas con el juego o el uso de determinadas tecnologías). El trabajo psicológico se centra en comprender qué función cumple la conducta, gestionar las dificultades asociadas y sostener el proceso de cambio.",
    whenTitle: "¿Cuándo tiene sentido pedir ayuda?",
    whenText: "Cuando una conducta empieza a generar consecuencias negativas en tu vida personal, laboral o relacional, o cuando sientes que te cuesta controlarla por ti mismo/a. Pedir ayuda en ese momento, y no esperar, suele facilitar el proceso.",
    howTitle: "¿Cómo se trabaja en consulta?",
    howText: "Se realiza una valoración inicial para entender la situación concreta y, si es necesario, se orienta hacia la coordinación con otros profesionales o recursos especializados en adicciones. La psicoterapia acompaña el proceso de cambio y el trabajo sobre las causas y mantenedores de la conducta.",
    onlineText: "El seguimiento psicológico puede realizarse online para personas de toda España, siempre que la situación clínica lo permita, valorado caso a caso.",
    presentialText: "También se ofrece atención presencial en nuestro centro de Cerdanyola del Vallès, para pacientes de Barcelona y el Vallès Occidental.",
    faqs: [
      { question: "¿La terapia garantiza dejar la conducta adictiva?", answer: "No podemos garantizar resultados: el proceso depende de múltiples factores personales y de la propia motivación al cambio. La psicoterapia acompaña y ofrece herramientas, pero no sustituye la implicación activa de la persona ni, cuando es necesario, la atención médica especializada." },
      { question: "¿La psicoterapia sustituye a un tratamiento médico de desintoxicación?", answer: "No. Cuando la situación lo requiere, el abordaje psicológico se coordina con los recursos médicos o especializados correspondientes; la psicoterapia no sustituye la atención médica cuando esta es necesaria." },
      { question: "¿Puedo acudir aunque no esté seguro/a de tener un problema?", answer: "Sí. La consulta inicial sirve precisamente para valorar la situación juntos, sin presuponer un diagnóstico previo." }
    ],
    relatedSlugs: ["ansiedad-y-depresion", "crecimiento-personal"]
  },

  "autoestima": {
    heading: "Terapia para la autoestima",
    subtitle: "Un trabajo psicológico sobre cómo te relacionas contigo mismo/a.",
    directAnswer: "La terapia centrada en la autoestima trabaja la forma en que una persona se percibe, se valora y se trata a sí misma, con el objetivo de construir una relación más sana y estable con una misma.",
    whatIsTitle: "¿Qué significa trabajar la autoestima en terapia?",
    whatIsText: "No se trata de un diagnóstico, sino de un área de trabajo psicológico: cómo te hablas a ti mismo/a, cómo gestionas el error o la crítica, o cómo influye tu historia personal en la seguridad que sientes hoy. Suele abordarse junto con otras dificultades (ansiedad, relaciones, autoexigencia) con las que frecuentemente está relacionada.",
    whenTitle: "¿Cuándo puede ayudar este trabajo terapéutico?",
    whenText: "Cuando notas una autocrítica muy intensa, dificultad para poner límites, o que tu forma de valorarte interfiere en tus relaciones o decisiones. No existe un test que determine si tienes o no \"baja autoestima\": es la conversación en consulta la que permite entender tu situación concreta.",
    howTitle: "¿Cómo se trabaja en consulta?",
    howText: "El proceso parte de conocer tu historia y tu forma de relacionarte contigo mismo/a, para después trabajar, a tu ritmo, en construir una relación interna más equilibrada y sostenible.",
    onlineText: "Puede trabajarse en modalidad online por videollamada para personas de toda España.",
    presentialText: "También ofrecemos atención presencial en Cerdanyola del Vallès, para pacientes de Barcelona y el Vallès Occidental.",
    faqs: [
      { question: "¿Existe un test para saber si tengo baja autoestima?", answer: "No usamos tests de autodiagnóstico. La valoración se realiza en consulta, a partir de una conversación sobre tu situación concreta." },
      { question: "¿Cuántas sesiones hacen falta para mejorar la autoestima?", answer: "No hay un número estándar: depende de cada persona y se valora junto con el profesional a lo largo del proceso." },
      { question: "¿Puedo trabajar esto junto con otra dificultad, como la ansiedad?", answer: "Sí, es habitual que la autoestima se trabaje de forma conjunta con otras áreas cuando están relacionadas en tu situación concreta." }
    ],
    relatedSlugs: ["ansiedad-y-depresion", "crecimiento-personal"]
  },

  "emdr": {
    heading: "Terapia EMDR",
    subtitle: "Desensibilización y reprocesamiento por movimientos oculares para el abordaje de experiencias difíciles y traumáticas.",
    directAnswer: "EMDR (Eye Movement Desensitization and Reprocessing) es un tipo de psicoterapia orientada a ayudar a procesar recuerdos o experiencias difíciles que siguen generando malestar en el presente, mediante estimulación bilateral (habitualmente movimientos oculares guiados).",
    whatIsTitle: "¿Qué es EMDR?",
    whatIsText: "Es un enfoque psicoterapéutico específico para el trabajo con experiencias traumáticas o difíciles, en el que el profesional guía un proceso de estimulación bilateral mientras la persona accede, de forma pautada, a recuerdos o contenidos emocionales concretos.",
    whenTitle: "¿En qué situaciones puede utilizarse?",
    whenText: "Se utiliza principalmente en el abordaje del trauma psicológico, tanto ante eventos puntuales como ante experiencias más prolongadas o relacionales. La idoneidad para tu caso concreto se valora siempre en consulta.",
    howTitle: "¿Cómo es una sesión de EMDR?",
    howText: "Tras una fase de valoración y preparación, el profesional guía el proceso de estimulación bilateral mientras trabajáis juntos sobre el contenido acordado, respetando en todo momento tu ritmo y tu estado emocional.",
    onlineText: "La terapia EMDR puede aplicarse en modalidad online en muchos casos, mediante estimulación bilateral adaptada a pantalla. El terapeuta realiza siempre una valoración clínica previa de idoneidad para confirmar que el abordaje online es adecuado en tu situación.",
    presentialText: "También puede realizarse de forma presencial en nuestro centro de Cerdanyola del Vallès, para pacientes de Barcelona y el Vallès Occidental.",
    faqs: [
      { question: "¿Cuánto dura una sesión de EMDR?", answer: "En Esencialmente Psicología, la sesión específica de terapia EMDR tiene una duración de 75 minutos, mayor que una sesión estándar, dado que este abordaje requiere más tiempo y un ritmo de trabajo adaptado a cada persona." },
      { question: "¿Cuánto cuesta una sesión de EMDR?", answer: "El precio actualizado de la sesión de terapia EMDR se muestra en esta misma página, obtenido directamente de nuestro sistema de tarifas." },
      { question: "¿Puede realizarse EMDR de forma online?", answer: "En muchos casos sí, mediante estimulación bilateral adaptada a pantalla. El terapeuta valora siempre la idoneidad de la modalidad online en la primera consulta, atendiendo a la estabilidad emocional y las características de cada persona." },
      { question: "¿EMDR garantiza superar el trauma en un número fijo de sesiones?", answer: "No. Cada proceso es distinto y no existen garantías de resultado ni un número de sesiones predeterminado; el terapeuta valora la evolución junto con la persona a lo largo del proceso." }
    ],
    relatedSlugs: ["traumas-y-fobias", "duelo"]
  },

  "duelo": {
    heading: "Terapia de duelo",
    subtitle: "Un acompañamiento psicológico respetuoso durante procesos de pérdida.",
    directAnswer: "La terapia de duelo ofrece un espacio de acompañamiento psicológico ante la pérdida de una persona, relación o etapa vital importante, respetando el proceso y el ritmo propio de cada persona.",
    whatIsTitle: "¿Qué es el duelo y cuándo conviene acompañarlo en terapia?",
    whatIsText: "El duelo es un proceso emocional natural ante una pérdida. No todo duelo requiere terapia, pero el acompañamiento profesional puede ayudar cuando el malestar es muy intenso, se prolonga de forma que dificulta tu día a día, o sientes que necesitas un espacio para elaborarlo.",
    whenTitle: "¿Cuándo puede ayudar el acompañamiento psicológico durante un duelo?",
    whenText: "Cuando notas que la pérdida interfiere de forma sostenida en tu funcionamiento diario, tus relaciones o tu estado de ánimo, o simplemente cuando deseas un espacio propio para procesarla acompañado/a por un profesional. No existen plazos universales: cada duelo tiene su propio tiempo.",
    howTitle: "¿Cómo se trabaja en consulta?",
    howText: "El proceso respeta tu ritmo personal y tu forma particular de vivir la pérdida, sin imponer etapas ni tiempos predefinidos, ofreciendo un espacio de escucha y acompañamiento profesional.",
    onlineText: "El acompañamiento en duelo puede realizarse online por videollamada para personas de toda España.",
    presentialText: "También se ofrece de forma presencial en Cerdanyola del Vallès, para pacientes de Barcelona y el Vallès Occidental.",
    faqs: [
      { question: "¿Cuánto tiempo dura un duelo \"normal\"?", answer: "No existe un tiempo universal ni correcto: cada persona y cada pérdida son distintas. La terapia no impone plazos, acompaña el proceso propio de cada persona." },
      { question: "¿Es necesario acudir a terapia ante cualquier pérdida?", answer: "No siempre. Muchos duelos se elaboran con los propios recursos y el apoyo del entorno. La terapia es una opción cuando el malestar es muy intenso, se prolonga o sientes que necesitas un espacio profesional." },
      { question: "¿Puedo hacer terapia de duelo online?", answer: "Sí, puede realizarse por videollamada manteniendo el mismo cuidado profesional y confidencialidad que en una sesión presencial." }
    ],
    relatedSlugs: ["emdr", "ansiedad-y-depresion"]
  },

  "sexologia": {
    heading: "Sexología clínica",
    subtitle: "Atención psicológica profesional y respetuosa en torno a la sexualidad.",
    directAnswer: "La atención en sexología aborda, desde una perspectiva psicológica profesional, dificultades o dudas relacionadas con la sexualidad y el bienestar sexual, con un enfoque respetuoso y sin juicios.",
    whatIsTitle: "¿Qué aborda la atención en sexología?",
    whatIsText: "Puede incluir dificultades en la vivencia de la sexualidad, dudas sobre el propio deseo o funcionamiento sexual, o el impacto de otras dificultades (ansiedad, autoestima, relación de pareja) en la vida sexual. El abordaje siempre parte de tu situación y necesidades concretas.",
    whenTitle: "¿Cuándo puede ser útil buscar apoyo?",
    whenText: "Cuando algo relacionado con tu sexualidad te genera malestar, dudas o dificultad, y sientes que sería útil hablarlo en un espacio profesional y confidencial.",
    howTitle: "¿Cómo se trabaja en consulta?",
    howText: "Con una escucha respetuosa, sin juicios ni moralización, adaptando el abordaje a lo que tú traigas a consulta y a tu ritmo.",
    onlineText: "Esta atención puede ofrecerse en modalidad online por videollamada para personas de toda España.",
    presentialText: "También de forma presencial en Cerdanyola del Vallès, para pacientes de Barcelona y el Vallès Occidental.",
    faqs: [
      { question: "¿Es un tema del que se pueda hablar con total confidencialidad?", answer: "Sí, como en el resto de nuestra atención psicológica, la confidencialidad es un principio fundamental." },
      { question: "¿Puedo acudir en pareja o solo/a?", answer: "Ambas opciones son posibles; se valora en consulta cuál se ajusta mejor a tu situación." },
      { question: "¿Se puede tratar de forma online?", answer: "Sí, puede realizarse por videollamada manteniendo la misma confidencialidad y cuidado profesional." }
    ],
    relatedSlugs: ["autoestima", "crecimiento-personal"]
  },

  "ansiedad-y-depresion": {
    heading: "Terapia para la ansiedad y la depresión",
    subtitle: "Apoyo psicológico cuando la alerta no para, el ánimo no levanta, o ambas cosas a la vez.",
    directAnswer: "La terapia psicológica puede ayudar a entender y trabajar la ansiedad y los estados de ánimo bajo, explorando qué los está manteniendo y buscando, junto con el profesional, formas de recuperar equilibrio en la vida cotidiana. Cada situación es distinta: aquí no se encaja a las personas en etiquetas, sino que se entiende el caso concreto.",

    whatIsTitle: "Ansiedad, depresión o los dos: ¿de qué estamos hablando?",
    whatIsText: "La ansiedad y la depresión son dos experiencias distintas que a veces se solapan. La primera tiene que ver con la activación, la alerta, la anticipación del peligro —cuando la respuesta de alarma se activa aunque no haya una amenaza real, y cuesta apagarla. La segunda tiene que ver con el apagamiento: la dificultad para encontrar energía, interés o motivación, incluso cuando las circunstancias externas parecen estar bien. Ambas pueden afectar el sueño, el cuerpo, las relaciones y la capacidad de disfrutar del día a día. Y en muchos casos aparecen juntas, porque comparten mecanismos subyacentes comunes.",

    subBlocks: [
      {
        id: "ansiedad",
        title: "Cuando la alerta no para",
        content: "Quizás reconoces algunas de estas experiencias: una preocupación que se repite aunque sepas que es excesiva, tensión física sin motivo claro, dificultad para dormir porque la cabeza no para, evitar situaciones que te generan malestar aunque eso te limite, anticipar lo peor incluso cuando no hay razones reales, o notar reacciones físicas intensas (palpitaciones, presión en el pecho, falta de aire) en momentos que otros no considerarían amenazantes. La ansiedad es una respuesta del sistema nervioso que, en ciertos contextos, se activa de forma sostenida o desproporcionada. El trabajo terapéutico busca entender qué la está alimentando y encontrar formas de regularla que tengan sentido para tu situación concreta."
      },
      {
        id: "depresion",
        title: "Cuando el ánimo no levanta",
        content: "No siempre se trata de tristeza. A veces es más bien una sensación de vacío o de aplanamiento, de que las cosas que antes te importaban ya no te mueven igual, de que hacer el esfuerzo cotidiano cuesta mucho más de lo que debería. Puede ir acompañado de fatiga, cambios en el sueño o el apetito, dificultad para concentrarse, o una sensación persistente de que nada tiene demasiado sentido. Funcionar hacia el exterior es posible —ir al trabajo, cumplir— mientras por dentro hay un esfuerzo enorme que los demás no ven. La terapia ofrece un espacio para entender qué está pasando y trabajar desde ahí, sin presuponer un diagnóstico."
      },
      {
        id: "solapamiento",
        title: "Cuando se solapan",
        content: "Es habitual que ansiedad y bajo estado de ánimo aparezcan juntos: la activación constante agota, y ese agotamiento alimenta el apagamiento. O al revés: el desánimo genera una mirada hacia el futuro que activa el miedo. La valoración en consulta sirve precisamente para entender tu situación particular —no para encajarla en una categoría— y plantearte un abordaje que tenga en cuenta todo el cuadro."
      }
    ],

    whenTitle: "¿Cuándo puede ser útil pedir orientación?",
    whenText: "Cuando lo que sientes se mantiene en el tiempo y empieza a afectar a tu descanso, tus relaciones, tu trabajo o tu capacidad de disfrutar de las cosas. No hace falta esperar a estar en un punto de crisis. Tampoco es necesario saber exactamente qué te pasa antes de pedir cita: para eso está la valoración inicial.",

    howTitle: "¿Qué ocurre en la primera consulta?",
    howText: "Es una conversación —no un test, no un diagnóstico inmediato. El objetivo es entender tu situación: qué estás viviendo, desde cuándo, cómo te afecta y qué estás necesitando. A partir de ahí, si tiene sentido continuar, se plantea un plan de trabajo adaptado a tu caso. Puedes venir sin saber bien qué te pasa; precisamente para eso está ese primer espacio.",

    onlineText: "Puede trabajarse en modalidad online por videollamada para personas de toda España. Es una opción valorada positivamente por muchas personas, especialmente cuando el desplazamiento supone un esfuerzo adicional.",
    presentialText: "También de forma presencial en nuestro centro de Cerdanyola del Vallès, con buena conexión para Barcelona y el Vallès Occidental.",

    crisisResource: {
      label: "Si tienes pensamientos de hacerte daño o estás en crisis",
      text: "Puedes llamar al 024, la línea de atención a la conducta suicida del Ministerio de Sanidad. Es gratuita, confidencial y está disponible las 24 horas, todos los días del año, para personas con ideación o riesgo de conducta suicida y también para familiares y allegados. Si hay una emergencia vital inminente, llama al 112. La atención psicológica de Esencialmente no sustituye a los servicios de emergencia."
    },

    faqs: [
      { question: "¿Cómo sé si lo que tengo es ansiedad, depresión o las dos cosas?", answer: "No lo sabrás antes de la primera consulta, y no hace falta. La valoración profesional sirve precisamente para entender tu situación concreta, sin encajarla en una categoría antes de conocerte." },
      { question: "¿La terapia psicológica sustituye al tratamiento médico o psiquiátrico?", answer: "No. Cuando es necesario, el trabajo psicológico se coordina con la atención médica o psiquiátrica correspondiente. En ningún caso la sustituye ni recomienda suspender un tratamiento médico en curso." },
      { question: "¿Puedo acudir aunque funcione bien hacia fuera pero me sienta mal por dentro?", answer: "Sí. Muchas personas que buscan apoyo psicológico mantienen su vida cotidiana aparentemente sin problemas: eso no significa que el malestar no sea real ni que no tenga sentido pedir ayuda." },
      { question: "¿Puedo hacer terapia online para esto?", answer: "En la mayoría de casos sí, y muchas personas lo valoran positivamente. La idoneidad de la modalidad online para tu situación concreta se valora en la primera consulta." }
    ],
    relatedSlugs: ["autoestima", "traumas-y-fobias"]
  },

  "violencia-de-genero": {
    heading: "Atención psicológica en violencia de género",
    subtitle: "Un espacio de apoyo psicológico sin culpabilización, como complemento a los recursos oficiales de seguridad y atención.",
    directAnswer: "Ofrecemos acompañamiento psicológico para personas que han vivido o viven situaciones de violencia de género: un espacio de escucha respetuosa, sin juicio y sin presión, orientado al bienestar emocional. Este apoyo es siempre complementario —nunca sustituto— de los recursos oficiales de seguridad, atención especializada o asesoramiento legal.",

    safetyBlock: {
      title: "Si estás en una situación de riesgo o necesitas ayuda urgente",
      primaryItems: [
        {
          label: "112",
          description: "Emergencias. Llama si estás en peligro inmediato."
        },
        {
          label: "016",
          description: "Servicio estatal gratuito y confidencial de información y atención psicosocial ante las violencias contra las mujeres. Disponible las 24 horas."
        },
        {
          label: "900 900 120",
          description: "Línea de atención de la Generalitat de Catalunya ante las violencias machistas. Gratuita, confidencial y disponible las 24 horas, todos los días del año."
        }
      ],
      secondaryLabel: "Más canales y recursos oficiales",
      secondaryItems: [
        {
          label: "WhatsApp 016",
          description: "600 000 016"
        },
        {
          label: "Chat online",
          description: "violenciagenero.igualdad.gob.es"
        },
        {
          label: "ATENPRO",
          description: "Servicio de atención y protección a distancia. Puedes informarte a través del 016."
        }
      ],
      note: "La consulta psicológica no es un recurso de emergencia. Si existe un riesgo inmediato, contacta primero con los servicios de emergencia."
    },

    whatIsTitle: "¿Qué puede ofrecer el acompañamiento psicológico?",
    whatIsText: "Un espacio para hablar de lo que has vivido o estás viviendo, sin que nadie te juzgue ni te diga qué tienes que hacer. El trabajo psicológico puede ayudar a procesar el impacto emocional de la situación, a entender cómo te ha afectado y a recuperar recursos propios a tu ritmo. No sustituye al asesoramiento jurídico, a los servicios sociales ni a los recursos de protección: los complementa.",

    whenTitle: "¿Qué formas puede tomar la violencia de género?",
    whenText: "La violencia de género no se limita a la violencia física. También puede manifestarse como control sobre las decisiones, el dinero o las relaciones de la otra persona; como insultos, humillaciones o amenazas sostenidas en el tiempo; como presión sexual; o como vigilancia y acoso a través del teléfono o las redes sociales. A veces es difícil reconocerlo cuando estás dentro. No necesitas tener claro si \"cuenta\" o no para buscar apoyo.",

    howTitle: "Apoyo psicológico sin obligación de denunciar",
    howText: "Pedir apoyo psicológico no implica iniciar ningún proceso legal ni denunciar. Son decisiones completamente independientes. Puedes venir a consulta en cualquier momento del proceso: si todavía estás en la situación, si la has dejado atrás hace tiempo, o si tienes dudas sobre lo que estás viviendo. El ritmo y los pasos los decides tú.",

    onlineText: "Esta atención puede ofrecerse en modalidad online por videollamada para personas de toda España, lo que puede facilitar el acceso cuando hay dificultades de movilidad o privacidad.",
    presentialText: "También de forma presencial en nuestro centro de Cerdanyola del Vallès, para pacientes de Barcelona y el Vallès Occidental.",

    faqs: [
      { question: "¿Tengo que haber denunciado para pedir apoyo psicológico?", answer: "No. El apoyo psicológico no está condicionado a que exista ningún proceso legal. Puedes consultar en cualquier momento, independientemente de lo que hayas decidido hacer o no en el ámbito legal o institucional." },
      { question: "¿La terapia me dirá qué tengo que hacer?", answer: "No. El espacio psicológico no dirige ni prescribe decisiones. Acompaña a la persona mientras ella decide, a su ritmo, qué quiere hacer con su situación." },
      { question: "¿Qué hago si estoy en una situación de riesgo ahora mismo?", answer: "Llama al 112 si estás en peligro inmediato, o al 016 (gratuito, disponible 24h, no aparece en la factura) para orientación y atención especializada. La psicoterapia no es un recurso de emergencia." },
      { question: "¿Puedo pedir cita aunque no esté segura de que lo que vivo es violencia de género?", answer: "Sí. No hace falta tener una certeza previa ni haber puesto nombre a lo que estás viviendo. Para eso existe también la primera consulta: para hablar y entender juntos." }
    ],
    relatedSlugs: ["ansiedad-y-depresion", "autoestima"]
  },

  "crecimiento-personal": {
    heading: "Terapia de crecimiento personal",
    subtitle: "Un espacio de reflexión y desarrollo personal acompañado por un profesional.",
    directAnswer: "El trabajo de crecimiento personal en terapia ofrece un espacio estructurado, con un profesional, para reflexionar sobre tu vida, tus decisiones y tu bienestar, más allá de la presencia de un síntoma concreto.",
    whatIsTitle: "¿Qué significa trabajar el crecimiento personal en terapia?",
    whatIsText: "No siempre se acude a terapia por un malestar intenso: también puede ser un espacio para el autoconocimiento, la toma de decisiones vitales o la mejora del propio bienestar, siempre desde un enfoque psicológico profesional, no de autoayuda genérica.",
    whenTitle: "¿Para quién puede ser útil?",
    whenText: "Para personas que buscan un espacio de reflexión acompañada sobre su momento vital, sus relaciones o sus objetivos personales.",
    howTitle: "¿Cómo se trabaja en consulta?",
    howText: "A partir de tus objetivos concretos, con un enfoque psicológico profesional y adaptado a tu situación, evitando fórmulas genéricas.",
    onlineText: "Puede trabajarse en modalidad online por videollamada para personas de toda España.",
    presentialText: "También de forma presencial en Cerdanyola del Vallès, para pacientes de Barcelona y el Vallès Occidental.",
    faqs: [
      { question: "¿Es necesario tener un problema psicológico para pedir este tipo de terapia?", answer: "No necesariamente. Puede solicitarse como espacio de reflexión y desarrollo personal, no solo ante la presencia de un malestar clínico." },
      { question: "¿Cuánto dura este tipo de proceso?", answer: "Depende de tus objetivos y se acuerda junto con el profesional; no hay una duración estándar." },
      { question: "¿Se puede combinar con el abordaje de otra dificultad?", answer: "Sí, es habitual que se trabaje junto con otras áreas cuando tiene sentido en tu situación concreta." }
    ],
    relatedSlugs: ["autoestima", "adicciones"]
  },

  "psicologia-afirmativa-lgtbiq": {
    heading: "Psicología afirmativa LGTBIQ+",
    subtitle: "Atención psicológica respetuosa con la diversidad de orientación sexual e identidad de género.",
    directAnswer: "La psicología afirmativa LGTBIQ+ es un enfoque de atención psicológica que reconoce y respeta la diversidad de orientación sexual e identidad de género como parte legítima de la experiencia humana, sin patologizarla.",
    whatIsTitle: "¿Qué significa psicología afirmativa?",
    whatIsText: "Significa ofrecer un espacio terapéutico donde la orientación sexual o la identidad de género de la persona no se cuestionan ni se tratan como un problema a resolver, sino que se acompañan las dificultades reales que la persona traiga a consulta, en un entorno seguro y respetuoso.",
    whenTitle: "¿Cuándo puede ser útil este tipo de atención?",
    whenText: "Ante cualquier dificultad emocional o vital en la que sientas la importancia de ser atendido/a en un espacio que entienda y respete tu identidad sin necesidad de explicaciones previas.",
    howTitle: "¿Cómo se trabaja en consulta?",
    howText: "Desde el respeto, la escucha y la ausencia de juicio, adaptando el abordaje terapéutico a lo que necesites, sin partir de supuestos sobre tu identidad u orientación.",
    onlineText: "Esta atención puede ofrecerse en modalidad online por videollamada para personas de toda España.",
    presentialText: "También de forma presencial en Cerdanyola del Vallès, para pacientes de Barcelona y el Vallès Occidental.",
    faqs: [
      { question: "¿La psicología afirmativa busca cambiar mi orientación o identidad?", answer: "No. La psicología afirmativa parte del respeto a tu orientación e identidad tal como las vives; no promueve ni practica ningún tipo de \"terapia de conversión\", que rechazamos explícitamente." },
      { question: "¿Tengo que explicar o justificar mi identidad en la primera consulta?", answer: "No es necesario justificarla; el espacio terapéutico parte del respeto a cómo te defines." },
      { question: "¿Puedo acudir por cualquier motivo, no solo por temas relacionados con mi identidad?", answer: "Sí, puedes acudir por cualquier dificultad; el enfoque afirmativo es el marco de respeto en el que se ofrece toda la atención." }
    ],
    relatedSlugs: ["autoestima", "crecimiento-personal"]
  },

  "bullying": {
    heading: "Apoyo psicológico ante el bullying",
    subtitle: "Acompañamiento psicológico ante situaciones de acoso escolar, para la persona afectada, su familia o su entorno.",
    directAnswer: "Ofrecemos apoyo psicológico ante situaciones de bullying o acoso escolar, tanto para la persona afectada como para familiares que buscan orientación sobre cómo acompañar la situación.",
    whatIsTitle: "¿A quién puede dirigirse esta atención?",
    whatIsText: "Puede consultar tanto la persona afectada (niño, niña o adolescente, o también una persona adulta que recuerda una experiencia pasada) como un padre, madre o familiar que busca orientación sobre cómo actuar y acompañar.",
    whenTitle: "¿Cuándo puede ser útil pedir apoyo?",
    whenText: "Ante cualquier sospecha o certeza de una situación de acoso escolar, es recomendable buscar apoyo tanto psicológico como la coordinación con el centro educativo correspondiente, que dispone de sus propios protocolos.",
    howTitle: "¿Cómo se trabaja en consulta?",
    howText: "Con prudencia especial cuando se trabaja con población menor, adaptando el lenguaje y el abordaje a la edad y situación de cada persona, e implicando a la familia cuando corresponda.",
    onlineText: "Esta atención puede ofrecerse en modalidad online por videollamada para personas de toda España.",
    presentialText: "También de forma presencial en Cerdanyola del Vallès, para pacientes de Barcelona y el Vallès Occidental.",
    faqs: [
      { question: "¿La terapia sustituye la actuación del centro escolar?", answer: "No. El apoyo psicológico es complementario a los protocolos y actuación del centro educativo, que tiene sus propios mecanismos ante situaciones de acoso escolar." },
      { question: "¿Puede acudir un familiar sin el niño o adolescente?", answer: "Sí, es posible una consulta de orientación para un familiar que busca entender cómo actuar." },
      { question: "¿Se puede tratar de forma online?", answer: "Sí, puede realizarse por videollamada, valorando siempre en consulta si es la modalidad más adecuada según la edad y situación." }
    ],
    relatedSlugs: ["ansiedad-y-depresion", "autoestima"]
  }
};
