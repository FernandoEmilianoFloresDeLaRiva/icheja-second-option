import { useState, useEffect } from 'react';

const LetterIdentificationGame = () => {
    // Alfabeto
    const alphabet = [
        'A', 'a', 'A', 'a', 'A', 'a', // Se repite más veces para aumentar probabilidad
        'B', 'b', 'C', 'c', 'D', 'd', 'E', 'e',
        'F', 'f', 'G', 'g', 'H', 'h', 'I', 'i', 'J', 'j',
        'K', 'k', 'L', 'l', 'M', 'm', 'N', 'n', 'O', 'o',
        'P', 'p', 'Q', 'q', 'R', 'r', 'S', 's', 'T', 't',
        'U', 'u', 'V', 'v', 'W', 'w', 'X', 'x', 'Y', 'y',
        'Z', 'z'
    ];

    const [currentLetter, setCurrentLetter] = useState('');
    const [correctCount, setCorrectCount] = useState(0);
    const [wrongCount, setWrongCount] = useState(0);
    const [feedback, setFeedback] = useState<'correct' | 'wrong' | null>(null);
    const [gameFinished, setGameFinished] = useState(false);

    // Función para obtener una letra aleatoria
    const getRandomLetter = () => {
        const randomIndex = Math.floor(Math.random() * alphabet.length);
        return alphabet[randomIndex];
    };

    // Inicializar con una letra aleatoria
    useEffect(() => {
        setCurrentLetter(getRandomLetter());
    }, []);

    // Función para verificar si la letra actual es "A" o "a"
    const isTargetLetter = (letter: string) => {
        return letter === 'A' || letter === 'a';
    };

    // Manejar respuesta del usuario
    const handleAnswer = (userSaysYes: boolean) => {
        const isCorrectLetter = isTargetLetter(currentLetter);
        const isCorrectAnswer = userSaysYes === isCorrectLetter;

        if (isCorrectAnswer) {
            setFeedback('correct');
            if (isCorrectLetter) {
                const newCount = correctCount + 1;
                setCorrectCount(newCount);

                // Verificar si ganó
                if (newCount >= 5) {
                    setTimeout(() => {
                        setGameFinished(true);
                    }, 800);
                    return;
                }
            }
        } else {
            setFeedback('wrong');
            setWrongCount(wrongCount + 1);
        }

        // Mostrar feedback y cambiar letra después de un momento
        setTimeout(() => {
            setFeedback(null);
            setCurrentLetter(getRandomLetter());
        }, 800);
    };

    // Reiniciar juego
    const resetGame = () => {
        setCorrectCount(0);
        setWrongCount(0);
        setFeedback(null);
        setGameFinished(false);
        setCurrentLetter(getRandomLetter());
    };

    // Obtener color de fondo según el estado
    const getBackgroundColor = () => {
        if (feedback === 'correct') return '#22C55E';
        if (feedback === 'wrong') return '#EF4444';
        return '#FFFFFF';
    };

    // Mensaje de felicitaciones al completar el juego
    if (gameFinished) {
        return (
            <div className="fixed inset-0 flex items-center justify-center z-50">
                <div
                    className="bg-white border-4 rounded-2xl shadow-2xl p-8 text-center flex flex-col items-center gap-4"
                    style={{ borderColor: '#009887' }}
                >
                    <div className="text-6xl">🎉</div>

                    <h2
                        className="text-3xl font-bold"
                        style={{ color: '#009887' }}
                    >
                        ¡Felicidades!
                    </h2>

                    <p className="text-xl text-gray-700">
                        Encontraste las 5 vocales "A"
                    </p>

                    <button
                        onClick={resetGame}
                        className="text-white px-6 py-3 rounded-2xl font-bold text-lg transition-all shadow-md"
                        style={{
                            backgroundColor: '#009887'
                        }}
                    >
                        Jugar de nuevo
                    </button>
                </div>
            </div>
        );
    }



    return (
        <div className="w-full flex items-center justify-between gap-4">
            {/* Contador de aciertos - izquierda */}
            <div className="flex flex-col items-center gap-3">
                <div className="bg-white px-4 py-2 rounded-full shadow-md">
                    <span className="text-sm font-semibold text-gray-700">
                        Vocales "A":
                        <span className="text-red-500 font-bold ml-1">{correctCount}/5</span>
                    </span>
                </div>

                {/* Pregunta */}
                <div className="text-center max-w-[120px]">
                    <p className="text-sm text-gray-700 font-semibold">
                        ¿Esta letra es "A" o "a"?
                    </p>
                </div>
            </div>

            {/* Contenedor de letra - centro */}
            <div className="flex justify-center">
                <div
                    className="w-48 h-48 rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300"
                    style={{ backgroundColor: getBackgroundColor() }}
                >
                    <span className="text-[120px] font-bold text-black">
                        {currentLetter}
                    </span>
                </div>
            </div>

            {/* Botones de respuesta - derecha */}
            <div className="flex flex-col gap-3">
                <button
                    onClick={() => handleAnswer(true)}
                    disabled={feedback !== null}
                    className="bg-green-500 hover:bg-green-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-xl transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                    Sí
                </button>
                <button
                    onClick={() => handleAnswer(false)}
                    disabled={feedback !== null}
                    className="bg-red-500 hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed text-white px-8 py-3 rounded-xl font-bold text-xl transition-all shadow-lg hover:scale-105 active:scale-95"
                >
                    No
                </button>
            </div>
        </div>
    );
};

export default LetterIdentificationGame;

