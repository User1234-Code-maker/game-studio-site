/* Languages: English, Russian, Spanish.
   The HTML stays in English (it is the source of truth and what search engines
   and no-JS visitors get). This file swaps visible text, placeholders, aria-labels,
   alt texts and the page title for the chosen language, remembers the choice, and
   exposes window.t("English text") for messages written in JavaScript.

   To add or fix a translation, edit one row of ROWS: [English, Русский, Español]. */
(() => {
  const LANGS = ["en", "ru", "es"];
  const INDEX = { ru: 1, es: 2 };

  const ROWS = [
    ["Warrior with a glowing sword in a teal-lit hall", "Воин со светящимся мечом в бирюзовом зале", "Guerrera con una espada luminosa en una sala turquesa"],
    ["Close-up of an anime character with snow in the hair", "Крупный план аниме-персонажа со снегом в волосах", "Primer plano de un personaje de anime con nieve en el pelo"],
    ["Join the community", "Присоединяйтесь к сообществу", "Únete a la comunidad"],
    ["Playtest invitations, release news and studio stories reach your inbox first.", "Приглашения на плейтесты, новости о релизах и истории студии — сначала к вам на почту.", "Las invitaciones a playtests, las novedades de lanzamientos y las historias del estudio llegan primero a tu correo."],
    ["Subscribe to receive the latest news and updates from Logo. We promise not to spam you!", "Подпишитесь, чтобы получать новости и обновления Logo. Обещаем не спамить!", "Suscríbete para recibir las últimas noticias y novedades de Logo. ¡Prometemos no enviarte spam!"],
    ["We design, build and ship 3D games for PC, mobile, console and VR.", "Проектируем, разрабатываем и выпускаем 3D-игры для ПК, мобильных устройств, консолей и VR.", "Diseñamos, desarrollamos y publicamos juegos 3D para PC, móviles, consolas y realidad virtual."],
    ["21 Old Street, Shoreditch, London", "Лондон, 21 Old Street, Шордич", "21 Old Street, Shoreditch, Londres"],
    ["Services", "Услуги", "Servicios"],
    ["Logo Games", "Logo Games", "Logo Games"],
    ["We build games people can't put down", "Мы делаем игры, от которых не оторваться", "Creamos juegos de los que nadie quiere despegarse"],
    ["From the first prototype to launch day, our team designs, builds and ships 3D games for PC, mobile and consoles.", "От первого прототипа до дня релиза наша команда проектирует, разрабатывает и выпускает 3D-игры для ПК, мобильных устройств и консолей.", "Desde el primer prototipo hasta el día del lanzamiento, nuestro equipo diseña, desarrolla y publica juegos 3D para PC, móviles y consolas."],
    ["Every project starts with a playable prototype. We test early with real players, keep what is fun and cut what is not, so the final game feels right from the very first minute.", "Каждый проект начинается с играбельного прототипа. Мы рано тестируем его на настоящих игроках, оставляем то, что весело, и убираем лишнее, чтобы готовая игра с первой минуты ощущалась правильно.", "Cada proyecto empieza con un prototipo jugable. Lo probamos pronto con jugadores reales, nos quedamos con lo divertido y descartamos el resto, para que el juego final se sienta bien desde el primer minuto."],
    ["Art, code, sound and live operations are handled by one team, so nothing gets lost between hand-offs. Pick a single service or let us take the project from concept to release.", "Графика, код, звук и поддержка после релиза — в руках одной команды, поэтому ничего не теряется при передаче между подрядчиками. Выберите одну услугу или доверьте нам проект от идеи до релиза.", "Arte, código, sonido y operación en vivo están en manos de un solo equipo, así que nada se pierde entre traspasos. Elige un solo servicio o deja que llevemos el proyecto del concepto al lanzamiento."],
    ["Built for players, shaped by play", "Создано для игроков, отточено игрой", "Hecho para los jugadores, pulido jugando"],
    ["Artists, engineers and designers in 18 offices, making games together.", "Художники, инженеры и дизайнеры из 18 офисов делают игры вместе.", "Artistas, ingenieros y diseñadores de 18 oficinas, creando juegos juntos."],
    ["Everything a game needs, under one roof", "Всё, что нужно игре, под одной крышей", "Todo lo que un juego necesita, bajo un mismo techo"],
    ["A selection of games and interactive experiences we have shipped with our partners over the last few years.", "Подборка игр и интерактивных проектов, которые мы выпустили вместе с партнёрами за последние годы.", "Una selección de juegos y experiencias interactivas que hemos publicado con nuestros socios en los últimos años."],
    ["A studio built by players, for players", "Студия, созданная игроками для игроков", "Un estudio creado por jugadores, para jugadores"],
    ["Logo started in 2012 as five friends making mobile games after work. Today we are a global studio shipping 3D games on every major platform.", "Logo начиналась в 2012 году: пятеро друзей делали мобильные игры по вечерам. Сегодня мы международная студия, выпускающая 3D-игры на всех основных платформах.", "Logo nació en 2012 como cinco amigos haciendo juegos móviles después del trabajo. Hoy somos un estudio global que publica juegos 3D en todas las plataformas principales."],
    ["Logo began in 2012 with five friends and one very loud shared apartment. Our first mobile game found a loyal audience, and the studio grew one project at a time: PC, consoles, then AR and VR. Today we still start every project the same way, with a playable idea and honest feedback from players.", "Logo началась в 2012 году с пятерых друзей и одной очень шумной съёмной квартиры. Наша первая мобильная игра нашла верную аудиторию, и студия росла проект за проектом: ПК, консоли, затем AR и VR. Сегодня мы по-прежнему начинаем каждый проект одинаково — с играбельной идеи и честных отзывов игроков.", "Logo empezó en 2012 con cinco amigos y un piso compartido muy ruidoso. Nuestro primer juego móvil encontró un público fiel y el estudio creció proyecto a proyecto: PC, consolas y después AR y VR. Hoy seguimos empezando cada proyecto igual, con una idea jugable y la opinión sincera de los jugadores."],
    ["Craft", "Мастерство", "Oficio"],
    ["Quality you can feel", "Качество, которое чувствуется", "Calidad que se nota"],
    ["Every build goes through art, gameplay and performance reviews, so polish is part of the process and never a last-minute rush.", "Каждая сборка проходит ревью графики, геймплея и производительности, поэтому отполированность — часть процесса, а не авральная спешка в конце.", "Cada versión pasa revisiones de arte, jugabilidad y rendimiento, así que el pulido es parte del proceso y nunca una carrera de última hora."],
    ["People", "Люди", "Personas"],
    ["Teams that stay together", "Команды, которые остаются вместе", "Equipos que se quedan"],
    ["Most of our developers have been with us for years. Stable teams know the codebase, the pipeline and each other, and it shows in the result.", "Большинство наших разработчиков работают с нами годами. Стабильная команда знает кодовую базу, пайплайн и друг друга — и это видно в результате.", "La mayoría de nuestros desarrolladores lleva años con nosotros. Un equipo estable conoce el código, el flujo de trabajo y a sus compañeros, y eso se nota en el resultado."],
    ["Reach", "Охват", "Alcance"],
    ["Global, yet close", "Весь мир, но рядом", "Global, pero cercano"],
    ["With 18 offices we work in your time zone and speak your language, while sharing tools and standards across every studio.", "Имея 18 офисов, мы работаем в вашем часовом поясе и говорим на вашем языке, а инструменты и стандарты у всех студий общие.", "Con 18 oficinas trabajamos en tu zona horaria y hablamos tu idioma, compartiendo herramientas y estándares en todos los estudios."],
    ["Our story", "Наша история", "Nuestra historia"],
    ["From a shared apartment to a global studio", "От съёмной квартиры до международной студии", "De un piso compartido a un estudio global"],
    ["Anna Petrova", "Анна Петрова", "Anna Petrova"],
    ["Daniel Moreno", "Даниэль Морено", "Daniel Moreno"],
    ["Mei Tanaka", "Мэй Танака", "Mei Tanaka"],
    ["Oliver Smith", "Оливер Смит", "Oliver Smith"],
    ["CEO", "Генеральный директор", "Directora general"],
    ["Creative Director", "Креативный директор", "Director creativo"],
    ["Head of Engineering", "Руководитель разработки", "Jefa de ingeniería"],
    ["Art Director", "Арт-директор", "Director de arte"],
    ["Let's talk about your game", "Поговорим о вашей игре", "Hablemos de tu juego"],
    ["Tell us about your idea, or find the office closest to you.", "Расскажите о своей идее или найдите ближайший к вам офис.", "Cuéntanos tu idea o encuentra la oficina más cercana."],
    ["Share a few details and a producer will reply within two working days.", "Оставьте пару деталей, и продюсер ответит в течение двух рабочих дней.", "Cuéntanos algunos detalles y un productor responderá en dos días laborables."],
    ["Meet the neon dragon: how our newest art style came together", "Знакомьтесь, неоновый дракон: как родился наш новый художественный стиль", "Conoce al dragón de neón: así nació nuestro nuevo estilo artístico"],
    ["6 min read", "6 мин чтения", "6 min de lectura"],
    ["Our new art direction began as a single paint-over on a Friday afternoon. Within a week the whole team was sketching glowing dragons, and the look quickly became the backbone of the next game's world. We kept the shapes bold, the colours saturated and the lighting dramatic, so that every frame works as a poster.", "Новое художественное направление началось с одного пейнт-овера в пятницу днём. Через неделю вся команда рисовала светящихся драконов, и этот образ быстро стал основой мира следующей игры. Мы оставили формы смелыми, цвета насыщенными, а свет драматичным, чтобы любой кадр можно было повесить как постер.", "Nuestra nueva dirección de arte empezó con un único paint-over un viernes por la tarde. En una semana todo el equipo dibujaba dragones luminosos y ese aspecto se convirtió pronto en la base del mundo del próximo juego. Mantuvimos las formas atrevidas, los colores saturados y la iluminación dramática, para que cada fotograma funcione como un póster."],
    ["Next up: turning the concept into real-time characters without losing the painted feel.", "Дальше — превратить концепт в персонажей реального времени, не потеряв «рисованное» ощущение.", "Lo siguiente: convertir el concepto en personajes en tiempo real sin perder el aspecto pintado."],
    ["Night streets, real rain: building a city players want to get lost in", "Ночные улицы, настоящий дождь: как мы строим город, в котором хочется заблудиться", "Calles de noche, lluvia de verdad: cómo construimos una ciudad en la que perderse"],
    ["5 min read", "5 мин чтения", "5 min de lectura"],
    ["We built the street from reference photos of night markets, then spent weeks on wet surfaces, neon reflections and small details such as the cat by the shop window. The goal was a place that feels lived in, where players slow down just to look around.", "Улицу мы собирали по фотографиям ночных рынков, а потом неделями возились с мокрыми поверхностями, отражениями неона и мелочами вроде кота у витрины. Цель — место, где чувствуется жизнь и где игроки замедляются просто чтобы осмотреться.", "Construimos la calle a partir de fotos de mercados nocturnos y después pasamos semanas con superficies mojadas, reflejos de neón y detalles como el gato junto al escaparate. El objetivo era un lugar con vida, donde los jugadores se detienen solo para mirar."],
    ["Inside our planning workshops: from sticky notes to sprint goals", "Как проходят наши планёрки: от стикеров к целям спринта", "Así son nuestros talleres de planificación: de las notas adhesivas a los objetivos del sprint"],
    ["4 min read", "4 мин чтения", "4 min de lectura"],
    ["Teaching the next generation of game developers", "Учим следующее поколение разработчиков игр", "Formamos a la próxima generación de desarrolladores de juegos"],
    ["3 min read", "3 мин чтения", "3 min de lectura"],
    ["What we learned from kids play-testing our family game", "Чему нас научили дети на плейтесте семейной игры", "Lo que aprendimos al probar nuestro juego familiar con niños"],
    ["Sofia Reyes", "София Рейес", "Sofía Reyes"],
    ["Puzzle design: why the best levels teach without words", "Дизайн головоломок: почему лучшие уровни учат без слов", "Diseño de puzles: por qué los mejores niveles enseñan sin palabras"],
    ["Luca Romano", "Лука Романо", "Luca Romano"],
    ["Our new co-working floor opens in London", "В Лондоне открывается наш новый коворкинг", "Abrimos una nueva planta de coworking en Londres"],
    ["Hana Kim", "Хана Ким", "Hana Kim"],
    ["2 min read", "2 мин чтения", "2 min de lectura"],
    ["Teamwork on the water: our annual rowing day", "Командная работа на воде: наш ежегодный день гребли", "Trabajo en equipo sobre el agua: nuestro día anual de remo"],
    ["Dawn on the water: a morning with the team", "Рассвет на воде: утро вместе с командой", "Amanecer en el agua: una mañana con el equipo"],
    ["Studio news and stories", "Новости и истории студии", "Noticias e historias del estudio"],
    ["Release notes, behind-the-scenes looks and lessons learned by our teams.", "Заметки о релизах, закулисье и уроки, которые извлекли наши команды.", "Notas de lanzamientos, un vistazo entre bambalinas y lecciones de nuestros equipos."],
    ["Character running through a neon city", "Персонаж бежит по неоновому городу", "Personaje corriendo por una ciudad de neón"],
    ["Character standing in a neon-lit city street", "Персонаж на улице города в неоновом свете", "Personaje en una calle iluminada con neón"],
    ["Stylised character in neon light", "Стилизованный персонаж в неоновом свете", "Personaje estilizado con luz de neón"],
    // Menu and page chrome
    ["Home", "Главная", "Inicio"],
    ["About us", "О нас", "Nosotros"],
    ["Portfolio", "Портфолио", "Portafolio"],
    ["News", "Новости", "Noticias"],
    ["Contact us", "Связаться с нами", "Contáctanos"],
    ["Open menu", "Открыть меню", "Abrir menú"],
    ["Close menu", "Закрыть меню", "Cerrar menú"],
    ["Switch to light theme", "Включить светлую тему", "Cambiar al tema claro"],
    ["Switch to dark theme", "Включить тёмную тему", "Cambiar al tema oscuro"],
    ["Light theme", "Светлая тема", "Tema claro"],
    ["Dark theme", "Тёмная тема", "Tema oscuro"],
    ["Language", "Язык", "Idioma"],
    ["Breadcrumb", "Навигационная цепочка", "Ruta de navegación"],
    ["Email address", "Адрес электронной почты", "Correo electrónico"],
    ["Newsletter", "Рассылка", "Boletín"],
    ["Game Website", "Игровой сайт", "Sitio de juegos"],

    // Home
    ["3D game Dev", "Разработка 3D-игр", "Desarrollo de juegos 3D"],
    ["Work that we produce for our clients", "Работы, которые мы создаём для наших клиентов", "El trabajo que hacemos para nuestros clientes"],
    ["Get more details", "Узнать подробнее", "Ver más detalles"],
    ["Get in touch", "Связаться", "Ponte en contacto"],
    ["Currently Trending Games", "Сейчас в тренде", "Juegos en tendencia"],
    ["SEE ALL", "СМОТРЕТЬ ВСЕ", "VER TODO"],
    ["40 Followers", "40 подписчиков", "40 seguidores"],
    ["Mobile Game Development", "Разработка мобильных игр", "Desarrollo de juegos móviles"],
    ["PC Game Development", "Разработка игр для ПК", "Desarrollo de juegos para PC"],
    ["PS4 Game Development", "Разработка игр для PS4", "Desarrollo de juegos para PS4"],
    ["AR/VR Solutions", "AR/VR-решения", "Soluciones AR/VR"],
    ["AR/VR Design", "AR/VR-дизайн", "Diseño AR/VR"],
    ["3D Modelings", "3D-моделирование", "Modelado 3D"],
    ["Our Recent Projects", "Наши последние проекты", "Nuestros proyectos recientes"],
    ["The full games list", "Полный список игр", "La lista completa de juegos"],
    ["The full project list", "Полный список проектов", "La lista completa de proyectos"],

    // About
    ["Why work with us", "Почему выбирают нас", "Por qué trabajar con nosotros"],
    ["Our Team", "Наша команда", "Nuestro equipo"],
    ["Our team", "Наша команда", "Nuestro equipo"],
    ["Our story", "Наша история", "Nuestra historia"],
    ["Studio showcase", "Витрина студии", "Escaparate del estudio"],
    ["COO", "Операционный директор", "Directora de operaciones"],

    // Contact
    ["Say hello", "Напишите нам", "Escríbenos"],
    ["Contact form", "Форма обратной связи", "Formulario de contacto"],
    ["First Name", "Имя", "Nombre"],
    ["Last Name", "Фамилия", "Apellido"],
    ["Email Address", "Электронная почта", "Correo electrónico"],
    ["Message", "Сообщение", "Mensaje"],
    ["Follow us", "Мы в соцсетях", "Síguenos"],
    ["Get directions →", "Построить маршрут →", "Cómo llegar →"],
    ["offices", "офисов", "oficinas"],
    ["countries", "стран", "países"],
    ["people", "человек", "personas"],
    ["people on site", "человек в офисе", "personas en la oficina"],
    ["Choose an office", "Выберите офис", "Elige una oficina"],

    // Newsletter, footer
    ["Stay in the loop", "Будьте в курсе", "Mantente al día"],
    [
      "Subscribe to receive the latest news and updates about TDA. We promise not to spam you!",
      "Подпишитесь, чтобы получать новости и обновления TDA. Обещаем не спамить!",
      "Suscríbete para recibir las últimas noticias y novedades de TDA. ¡Prometemos no enviar spam!",
    ],
    ["Enter email address", "Введите адрес почты", "Introduce tu correo"],
    ["Continue", "Продолжить", "Continuar"],
    ["Careers", "Вакансии", "Empleo"],
    ["Copyright © 2026 Logo. All rights reserved.", "© 2026 Logo. Все права защищены.", "© 2026 Logo. Todos los derechos reservados."],

    // News
    ["Search articles", "Поиск статей", "Buscar artículos"],
    ["Search", "Поиск", "Buscar"],
    ["No articles found. Try another keyword.", "Статьи не найдены. Попробуйте другое слово.", "No se encontraron artículos. Prueba con otra palabra."],

    // 404 and the "Oops" dialog
    ["Level not found", "Уровень не найден", "Nivel no encontrado"],
    ["This page doesn't exist or was moved. Head back to the start and try again.", "Такой страницы нет, или её перенесли. Вернитесь на главную и попробуйте снова.", "Esta página no existe o se ha movido. Vuelve al inicio e inténtalo de nuevo."],
    ["Back to home", "На главную", "Volver al inicio"],
    ["Page not found", "Страница не найдена", "Página no encontrada"],
    ["Oops!", "Упс!", "¡Ups!"],
    ["Portfolio project: this link goes nowhere yet.", "Учебный проект: эта ссылка пока никуда не ведёт.", "Proyecto de portafolio: este enlace aún no lleva a ningún sitio."],
    ["Got it", "Понятно", "Entendido"],
    ["Close", "Закрыть", "Cerrar"],
    ["{0} isn't plugged in yet.", "Раздел «{0}» пока не подключён.", "«{0}» aún no está disponible."],
    ["Our {0} page isn't plugged in yet.", "Страница «{0}» пока не подключена.", "Nuestra página de {0} todavía no está conectada."],
    ["This page", "Эта страница", "Esta página"],

    // Form and server messages
    ["Please enter your first name.", "Введите ваше имя.", "Escribe tu nombre."],
    ["Please enter your last name.", "Введите вашу фамилию.", "Escribe tu apellido."],
    ["Enter a valid email address.", "Введите корректный адрес почты.", "Introduce un correo electrónico válido."],
    ["Message should be at least 10 characters.", "Сообщение должно быть не короче 10 символов.", "El mensaje debe tener al menos 10 caracteres."],
    ["Thanks! This is a demo site, so the message was not sent.", "Спасибо! Это демо-сайт, поэтому сообщение не отправлено.", "¡Gracias! Es un sitio de demostración, así que el mensaje no se ha enviado."],
    ["Thanks! This is a demo site, so nothing was saved.", "Спасибо! Это демо-сайт, поэтому ничего не сохранено.", "¡Gracias! Es un sitio de demostración, así que no se ha guardado nada."],
    ["Thanks! We will get back to you soon.", "Спасибо! Мы скоро свяжемся с вами.", "¡Gracias! Te responderemos pronto."],
    ["Thanks! You are subscribed.", "Спасибо! Вы подписаны.", "¡Gracias! Ya estás suscrito."],
    ["You are already subscribed.", "Вы уже подписаны.", "Ya estás suscrito."],
    ["Could not send the message. Please try again.", "Не удалось отправить сообщение. Попробуйте ещё раз.", "No se pudo enviar el mensaje. Inténtalo de nuevo."],
    ["Could not subscribe. Please try again.", "Не удалось подписаться. Попробуйте ещё раз.", "No se pudo suscribir. Inténtalo de nuevo."],
    ["Please check the highlighted fields.", "Проверьте выделенные поля.", "Revisa los campos resaltados."],
    ["Too many requests. Please try again in a minute.", "Слишком много запросов. Попробуйте через минуту.", "Demasiadas solicitudes. Inténtalo de nuevo en un minuto."],
    ["Something went wrong on our side.", "Что-то пошло не так на нашей стороне.", "Algo ha salido mal por nuestra parte."],
    ["We cannot accept new messages right now. Please email us instead.", "Сейчас мы не можем принять новые сообщения. Напишите нам на почту.", "Ahora mismo no podemos recibir mensajes nuevos. Escríbenos por correo."],

    // Page descriptions (meta tags)
    ["Game development studio: trending games, services and recent projects.", "Студия разработки игр: игры в тренде, услуги и недавние проекты.", "Estudio de desarrollo de juegos: juegos en tendencia, servicios y proyectos recientes."],
    ["About our game development studio: who we are, why clients work with us and meet the team.", "О нашей студии разработки игр: кто мы, почему клиенты выбирают нас, и знакомство с командой.", "Sobre nuestro estudio de desarrollo de juegos: quiénes somos, por qué los clientes confían en nosotros y nuestro equipo."],
    ["Contact our game development studio: find us on the map, call us or send a message.", "Свяжитесь с нашей студией: найдите нас на карте, позвоните или напишите.", "Contacta con nuestro estudio: encuéntranos en el mapa, llámanos o envía un mensaje."],
    ["Latest news from our game development studio: articles, stories and updates.", "Новости нашей студии: статьи, истории и обновления.", "Últimas noticias de nuestro estudio: artículos, historias y novedades."],

    // Alt texts
    ["Child playing in a bright room", "Ребёнок играет в светлой комнате", "Niño jugando en una habitación luminosa"],
    ["Colleagues working together at laptops", "Коллеги вместе работают за ноутбуками", "Compañeros trabajando juntos con portátiles"],
    ["Colourful jigsaw puzzle pieces", "Разноцветные детали пазла", "Piezas de puzle de colores"],
    ["Rowing boat on dark water", "Гребная лодка на тёмной воде", "Bote de remos sobre aguas oscuras"],
    ["Rowing team seen from above", "Команда гребцов, вид сверху", "Equipo de remo visto desde arriba"],
    ["Team discussing sticky notes in a meeting room", "Команда обсуждает стикеры в переговорной", "Equipo comentando notas adhesivas en una sala de reuniones"],
    ["Team working in a co-working space", "Команда работает в коворкинге", "Equipo trabajando en un espacio de coworking"],
    ["White game controller", "Белый игровой контроллер", "Mando de juego blanco"],

    // Placeholder copy: translated too, so a page never mixes languages
    ["Lorem Ipsum", "Заголовок", "Título"],
    ["Lorem ipsum", "Метка", "Etiqueta"],
    ["Lorem Ipsum is simply dummy text of the printing and typesetting industry.", "Lorem Ipsum — это просто текст-заглушка полиграфической и наборной индустрии.", "Lorem Ipsum es simplemente texto de relleno de la industria de la impresión y la composición."],
    ["Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard.", "Lorem Ipsum — это просто текст-заглушка полиграфической и наборной индустрии. Lorem Ipsum остаётся стандартом отрасли.", "Lorem Ipsum es simplemente texto de relleno de la industria de la impresión y la composición. Lorem Ipsum es el estándar del sector."],
    ["Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s.", "Lorem Ipsum — это просто текст-заглушка полиграфической и наборной индустрии. Lorem Ipsum остаётся стандартным текстом-заглушкой отрасли с 1500-х годов.", "Lorem Ipsum es simplemente texto de relleno de la industria de la impresión y la composición. Lorem Ipsum es el texto de relleno estándar del sector desde el siglo XVI."],
    ["Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s,", "Lorem Ipsum — это просто текст-заглушка полиграфической и наборной индустрии. Lorem Ipsum остаётся стандартным текстом-заглушкой отрасли с 1500-х годов,", "Lorem Ipsum es simplemente texto de relleno de la industria de la impresión y la composición. Lorem Ipsum es el texto de relleno estándar del sector desde el siglo XVI,"],
    ["Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries,", "Lorem Ipsum — это просто текст-заглушка полиграфической и наборной индустрии. Lorem Ipsum остаётся стандартным текстом-заглушкой отрасли с 1500-х годов, когда неизвестный печатник взял набор литер и перемешал его, чтобы сделать книгу образцов шрифтов. Он пережил не только пять столетий,", "Lorem Ipsum es simplemente texto de relleno de la industria de la impresión y la composición. Lorem Ipsum es el texto de relleno estándar del sector desde el siglo XVI, cuando un impresor desconocido tomó una galería de tipos y los mezcló para hacer un libro de muestras. Ha sobrevivido no solo cinco siglos,"],
    ["Lorem Ipsum is simply dummy text of the printing and.", "Lorem Ipsum — это просто текст-заглушка полиграфии и.", "Lorem Ipsum es simplemente texto de relleno de la impresión y."],
    ["Lorem Ipsum is simply dummy text of the printing .", "Lorem Ipsum — это просто текст-заглушка полиграфии .", "Lorem Ipsum es simplemente texto de relleno de la impresión ."],
    ["Lorem Ipsum is simply dummy text dummy text", "Lorem Ipsum — это просто текст-заглушка", "Lorem Ipsum es simplemente texto de relleno"],
    ["Lorem Ipsum is simply dummy text dummy text ?", "Lorem Ipsum — это просто текст-заглушка?", "¿Lorem Ipsum es simplemente texto de relleno?"],
    ["but also the leap into electronic typesetting", "но и переход к электронной вёрстке", "sino también el salto a la composición electrónica"],
    ["John peter", "Джон Питер", "John Peter"],
    ["John smash", "Джон Смэш", "John Smash"],
    [".5min", ".5 мин", ".5 min"],

    // Office addresses: written in Cyrillic for Russian, left as-is for Spanish (real street names)
    ["1 Raffles Place, #28-01", "Раффлз-плейс, 1, #28-01", "1 Raffles Place, #28-01"],
    ["12 Adeola Odeku Street", "улица Адеола Одеку, 12", "12 Adeola Odeku Street"],
    ["120 Broadway, Floor 14", "Бродвей, 120, 14-й этаж", "120 Broadway, Floor 14"],
    ["152 Teheran-ro, Gangnam", "Тэхеран-ро, 152, Каннам", "152 Teheran-ro, Gangnam"],
    ["2-1 Shibuya, Shibuya-ku", "Сибуя, 2-1, район Сибуя", "2-1 Shibuya, Shibuya-ku"],
    ["200 George Street, Level 8", "Джордж-стрит, 200, 8-й этаж", "200 George Street, Level 8"],
    ["21 Old Street, Shoreditch", "Олд-стрит, 21, Шордич", "21 Old Street, Shoreditch"],
    ["26th of July Street 15", "улица 26 Июля, 15", "26th of July Street 15"],
    ["34 Long Street, Cape Town", "Лонг-стрит, 34, Кейптаун", "34 Long Street, Cape Town"],
    ["548 Market Street, Suite 120", "Маркет-стрит, 548, офис 120", "548 Market Street, Suite 120"],
    ["88 Queen Street West", "Куин-стрит-Уэст, 88", "88 Queen Street West"],
    ["Av. Paulista 1000, Conj. 52", "пр. Паулиста, 1000, оф. 52", "Av. Paulista 1000, Conj. 52"],
    ["Av. Reforma 222, Piso 9", "пр. Реформа, 222, 9-й этаж", "Av. Reforma 222, Piso 9"],
    ["Bandra Kurla Complex, Tower B", "Бандра-Курла-комплекс, башня B", "Bandra Kurla Complex, Tower B"],
    ["Index Tower, DIFC", "Индекс-тауэр, DIFC", "Index Tower, DIFC"],
    ["Laugavegur 18, 2nd floor", "Лёйгавегюр, 18, 2-й этаж", "Laugavegur 18, 2nd floor"],
    ["Torstraße 112, 10119", "Торштрассе, 112, 10119", "Torstraße 112, 10119"],
    ["İstiklal Caddesi 140", "проспект Истикляль, 140", "İstiklal Caddesi 140"],

    // Offices: cities
    ["Berlin", "Берлин", "Berlín"],
    ["Cairo", "Каир", "El Cairo"],
    ["Cape Town", "Кейптаун", "Ciudad del Cabo"],
    ["Dubai", "Дубай", "Dubái"],
    ["Istanbul", "Стамбул", "Estambul"],
    ["Lagos", "Лагос", "Lagos"],
    ["London", "Лондон", "Londres"],
    ["Mexico City", "Мехико", "Ciudad de México"],
    ["Mumbai", "Мумбаи", "Bombay"],
    ["New York", "Нью-Йорк", "Nueva York"],
    ["Reykjavik", "Рейкьявик", "Reikiavik"],
    ["San Francisco", "Сан-Франциско", "San Francisco"],
    ["Seoul", "Сеул", "Seúl"],
    ["Singapore", "Сингапур", "Singapur"],
    ["Sydney", "Сидней", "Sídney"],
    ["São Paulo", "Сан-Паулу", "São Paulo"],
    ["Tokyo", "Токио", "Tokio"],
    ["Toronto", "Торонто", "Toronto"],

    // Offices: countries
    ["Australia", "Австралия", "Australia"],
    ["Brazil", "Бразилия", "Brasil"],
    ["Canada", "Канада", "Canadá"],
    ["Egypt", "Египет", "Egipto"],
    ["Germany", "Германия", "Alemania"],
    ["Iceland", "Исландия", "Islandia"],
    ["India", "Индия", "India"],
    ["Japan", "Япония", "Japón"],
    ["Mexico", "Мексика", "México"],
    ["Nigeria", "Нигерия", "Nigeria"],
    ["South Africa", "ЮАР", "Sudáfrica"],
    ["South Korea", "Южная Корея", "Corea del Sur"],
    ["Türkiye", "Турция", "Turquía"],
    ["UAE", "ОАЭ", "EAU"],
    ["USA", "США", "EE. UU."],
    ["United Kingdom", "Великобритания", "Reino Unido"],

    // Offices: roles
    ["3D modelling", "3D-моделирование", "Modelado 3D"],
    ["Art & animation", "Графика и анимация", "Arte y animación"],
    ["Asia-Pacific hub", "Хаб Азиатско-Тихоокеанского региона", "Centro de Asia-Pacífico"],
    ["Business development", "Развитие бизнеса", "Desarrollo de negocio"],
    ["Community team", "Команда сообщества", "Equipo de comunidad"],
    ["Creative studio", "Креативная студия", "Estudio creativo"],
    ["Engineering", "Разработка", "Ingeniería"],
    ["Game design", "Геймдизайн", "Diseño de juegos"],
    ["Headquarters", "Главный офис", "Sede central"],
    ["Level design", "Левел-дизайн", "Diseño de niveles"],
    ["Live operations", "Лайв-операции", "Operaciones en vivo"],
    ["Mobile games", "Мобильные игры", "Juegos móviles"],
    ["Partnerships", "Партнёрства", "Alianzas"],
    ["Porting & QA", "Портирование и QA", "Portado y QA"],
    ["QA lab", "QA-лаборатория", "Laboratorio de QA"],
    ["Sound design", "Звуковой дизайн", "Diseño de sonido"],
    ["Studio & publishing", "Студия и издательство", "Estudio y publicación"],
    ["Support centre", "Центр поддержки", "Centro de soporte"],
  ];

  const rows = new Map(ROWS.map((row) => [row[0], row]));
  const reverse = { ru: new Map(), es: new Map() };
  ROWS.forEach((row) => {
    reverse.ru.set(row[1], row[0]);
    reverse.es.set(row[2], row[0]);
  });

  let lang = "en";

  const norm = (text) => text.replace(/\s+/g, " ").trim();
  const fill = (text, args) => text.replace(/\{(\d+)\}/g, (_, i) => (args[i] === undefined ? "" : args[i]));

  // Phrases built from translated parts: "Berlin office", "Berlin, Germany: Engineering"…
  const PATTERNS = [
    [/^Recent project (\d+)$/, (m) => ({ ru: `Недавний проект ${m[1]}`, es: `Proyecto reciente ${m[1]}` })],
    [/^Trending game (\d+)$/, (m) => ({ ru: `Игра в тренде ${m[1]}`, es: `Juego en tendencia ${m[1]}` })],
    [/^(.+) office$/, (m) => ({ ru: `Офис: ${part(m[1])}`, es: `Oficina de ${part(m[1])}` })],
    [/^(.+), (.+): (.+)$/, (m) => {
      const text = `${part(m[1])}, ${part(m[2])}: ${part(m[3])}`;
      return { ru: text, es: text };
    }],
    [/^(.+) \| (.+)$/, (m) => {
      const text = `${part(m[1])} | ${part(m[2])}`;
      return { ru: text, es: text };
    }],
  ];

  function part(text) {
    const row = rows.get(text);
    return row && INDEX[lang] ? row[INDEX[lang]] : text;
  }

  // The translation for an English string, or null when there is none.
  function lookup(key) {
    if (lang === "en") return null;
    const row = rows.get(key);
    if (row) return row[INDEX[lang]];
    for (const [pattern, build] of PATTERNS) {
      const match = key.match(pattern);
      if (match) {
        const built = build(match)[lang];
        if (built !== key) return built;
      }
    }
    return null;
  }

  function t(english, ...args) {
    const translated = lookup(norm(english));
    return fill(translated || english, args);
  }

  // The English key behind an already translated string (used by the headline effect).
  function toEnglish(text) {
    const key = norm(text);
    return (lang !== "en" && reverse[lang].get(key)) || key;
  }

  /* ---------- Applying a language to the page ---------- */
  const textOriginal = new WeakMap();
  const attrOriginal = new WeakMap();
  const ATTRS = ["placeholder", "aria-label", "title", "alt"];

  function translateText(node) {
    const parent = node.parentElement;
    if (!parent || parent.closest("script, style, noscript, .fx-split, .ch, [data-i18n-skip]")) return;
    const source = textOriginal.has(node) ? textOriginal.get(node) : node.nodeValue;
    const key = norm(source);
    if (!key) return;
    const translated = lookup(key);
    if (translated) {
      textOriginal.set(node, source);
      const lead = source.match(/^\s*/)[0];
      const trail = source.match(/\s*$/)[0];
      node.nodeValue = lead + translated + trail;
    } else if (textOriginal.has(node)) {
      node.nodeValue = source;
      textOriginal.delete(node);
    }
  }

  function translateAttrs(el) {
    if (el.closest("[data-i18n-skip]")) return;
    ATTRS.forEach((attr) => {
      if (!el.hasAttribute(attr)) return;
      if (attr === "aria-label" && el.classList.contains("fx-split")) return; // the headline effect sets it
      const saved = attrOriginal.get(el) || {};
      const source = attr in saved ? saved[attr] : el.getAttribute(attr);
      const translated = lookup(norm(source));
      if (translated) {
        saved[attr] = source;
        attrOriginal.set(el, saved);
        el.setAttribute(attr, translated);
      } else if (attr in saved) {
        el.setAttribute(attr, source);
        delete saved[attr];
      }
    });
  }

  function apply(root) {
    if (root.nodeType === 3) return translateText(root);
    if (root.nodeType !== 1 && root.nodeType !== 9) return;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    let node;
    while ((node = walker.nextNode())) translateText(node);
    const scope = root.nodeType === 9 ? root.documentElement : root;
    if (scope.matches?.("[placeholder],[aria-label],[title],[alt]")) translateAttrs(scope);
    scope.querySelectorAll("[placeholder],[aria-label],[title],[alt]").forEach(translateAttrs);
  }

  /* ---------- Page title and meta tags ---------- */
  const metaSelectors = ['meta[name="description"]', 'meta[property="og:title"]', 'meta[property="og:description"]', 'meta[name="twitter:title"]', 'meta[name="twitter:description"]'];
  const titleSource = document.title;
  const metas = metaSelectors
    .map((selector) => document.querySelector(selector))
    .filter(Boolean)
    .map((el) => ({ el, source: el.content }));

  function applyHead() {
    document.title = lookup(norm(titleSource)) || titleSource;
    metas.forEach(({ el, source }) => {
      el.content = lookup(norm(source)) || source;
    });
  }

  /* ---------- Language switcher: a small dropdown at the right end of the header ---------- */
  const NAMES = { en: "English", ru: "Русский", es: "Español" };
  const GLOBE =
    '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" aria-hidden="true"><circle cx="12" cy="12" r="9"/><path d="M3 12h18M12 3c2.6 2.4 3.9 5.400 3.900 9s-1.300 6.600-3.900 9c-2.600-2.400-3.900-5.400-3.900-9S9.400 5.400 12 3z"/></svg>';
  const CHEVRON =
    '<svg class="lang__chevron" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M6 9l6 6 6-6"/></svg>';
  const CHECK =
    '<svg class="lang__check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.500l4.500 4.500L19 7.500"/></svg>';

  let switcher = null;
  let trigger = null;
  let list = null;

  function openList(open, focusOption = false) {
    if (!switcher) return;
    switcher.classList.toggle("is-open", open);
    trigger.setAttribute("aria-expanded", String(open));
    if (open && focusOption) list.querySelector('[aria-selected="true"]').focus();
  }

  function buildSwitcher() {
    const header = document.querySelector("header");
    if (!header) return;

    switcher = document.createElement("div");
    switcher.className = "lang";
    switcher.dataset.i18nSkip = "";
    switcher.innerHTML = `<button type="button" class="lang__btn" aria-haspopup="listbox" aria-expanded="false">${GLOBE}<span class="lang__code"></span>${CHEVRON}</button>
      <ul class="lang__list" role="listbox" tabindex="-1">${LANGS.map(
        (code) => `<li role="option" tabindex="-1" data-lang="${code}" lang="${code}"><span>${NAMES[code]}</span>${CHECK}</li>`,
      ).join("")}</ul>`;
    trigger = switcher.querySelector(".lang__btn");
    list = switcher.querySelector(".lang__list");

    trigger.addEventListener("click", () => openList(!switcher.classList.contains("is-open"), true));
    trigger.addEventListener("keydown", (event) => {
      if (event.key === "ArrowDown" || event.key === "ArrowUp") {
        event.preventDefault();
        openList(true, true);
      }
    });

    const choose = (option) => {
      setLang(option.dataset.lang);
      openList(false);
      trigger.focus();
    };
    list.addEventListener("click", (event) => {
      const option = event.target.closest("[data-lang]");
      if (option) choose(option);
    });
    list.addEventListener("keydown", (event) => {
      const options = Array.from(list.querySelectorAll("[data-lang]"));
      const at = options.indexOf(document.activeElement);
      const go = (index) => {
        event.preventDefault();
        options[(index + options.length) % options.length].focus();
      };
      if (event.key === "ArrowDown") go(at + 1);
      else if (event.key === "ArrowUp") go(at - 1);
      else if (event.key === "Home") go(0);
      else if (event.key === "End") go(options.length - 1);
      else if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        if (at >= 0) choose(options[at]);
      } else if (event.key === "Escape") {
        event.preventDefault();
        openList(false);
        trigger.focus();
      } else if (event.key === "Tab") openList(false);
    });
    document.addEventListener("click", (event) => {
      if (!switcher.contains(event.target)) openList(false);
    });

    header.append(switcher);
  }

  function paintSwitcher() {
    if (!switcher) return;
    switcher.querySelector(".lang__code").textContent = lang.toUpperCase();
    trigger.setAttribute("aria-label", `${t("Language")}: ${NAMES[lang]}`);
    list.setAttribute("aria-label", t("Language"));
    list.querySelectorAll("[data-lang]").forEach((option) => {
      option.setAttribute("aria-selected", String(option.dataset.lang === lang));
    });
  }

  function setLang(next, save = true) {
    if (!LANGS.includes(next)) return;
    lang = next;
    document.documentElement.lang = next;
    if (save) {
      try {
        localStorage.setItem("lang", next);
      } catch {
        /* private mode: the choice lasts for this visit */
      }
    }
    apply(document.body);
    applyHead();
    paintSwitcher();
    document.dispatchEvent(new CustomEvent("i18n:change", { detail: next }));
    // Text length changes: let layout-dependent scripts (stickers) measure again.
    window.dispatchEvent(new Event("resize"));
  }

  function initialLang() {
    try {
      const saved = localStorage.getItem("lang");
      if (LANGS.includes(saved)) return saved;
    } catch {
      /* ignore */
    }
    const browser = (navigator.language || "en").slice(0, 2).toLowerCase();
    return LANGS.includes(browser) ? browser : "en";
  }

  window.i18n = { t, toEnglish, apply, setLang, get lang() { return lang; } };
  window.t = t;

  buildSwitcher();
  setLang(initialLang(), false);

  // Content added later (search results, dialogs) is translated as it appears.
  new MutationObserver((records) => {
    if (lang === "en") return;
    records.forEach((record) => record.addedNodes.forEach(apply));
  }).observe(document.body, { childList: true, subtree: true });
})();
