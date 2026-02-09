import { useState } from 'react';
import { useLocation } from 'wouter';

const exerciseOptions = [
    { id: 1, image: "/select-letters/agua.png", label: "agua", targetLetter: "a" },
    { id: 2, image: "/select-letters/ajo.png", label: "ajo", targetLetter: "a" },
    { id: 3, image: "/select-letters/ambar.png", label: "ámbar", targetLetter: "a" },
    { id: 4, image: "/select-letters/arbol.png", label: "árbol", targetLetter: "a" },
    { id: 5, image: "/select-letters/arroz.png", label: "arroz", targetLetter: "a" },
    { id: 6, image: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?w=400&h=300&fit=crop", label: "amor", targetLetter: "a" },
    { id: 7, image: "/select-letters/azul.png", label: "azul", targetLetter: "a" },
    { id: 8, image: "/select-letters/avena.png", label: "avena", targetLetter: "a" },
    { id: 9, image: "https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=400&h=300&fit=crop", label: "animal", targetLetter: "a" },
    {id :10, image: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=400&h=300&fit=crop", label: "alejandra", targetLetter: "a   "}
];

export default function LetterSelectionGame() {
    const [currentIndex, setCurrentIndex] = useState(0);
    const [selectedLetters, setSelectedLetters] = useState<number[]>([]);
    const [letterStates, setLetterStates] = useState<Array<'correct' | 'incorrect' | undefined>>([]);
    const [gameCompleted, setGameCompleted] = useState(false);
    const [showCompletionModal, setShowCompletionModal] = useState(false);
    const [, setLocation] = useLocation();

    const currentExercise = exerciseOptions[currentIndex];
    const letters = currentExercise.label.split('');

    const checkLetter = (index: number, letter: string) => {
        if (letterStates[index] !== undefined) return;

        // Normalizar para comparar sin acentos
        const normalizedLetter = letter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const normalizedTarget = currentExercise.targetLetter.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "");
        const isCorrect = normalizedLetter === normalizedTarget;

        setSelectedLetters(prev => [...prev, index]);
        setLetterStates(prev => {
            const newStates = [...prev];
            newStates[index] = isCorrect ? 'correct' : 'incorrect';
            return newStates;
        });

        // Verificar si el juego está completado
        const targetIndices = letters
            .map((l, i) => l.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "") === normalizedTarget ? i : -1)
            .filter(i => i !== -1);

        const newSelectedCount = selectedLetters.length + 1;
        if (newSelectedCount >= targetIndices.length) {
            const allCorrect = targetIndices.every(i => {
                if (i === index) return isCorrect;
                return letterStates[i] === 'correct';
            });

            if (allCorrect) {
                setTimeout(() => {
                    setGameCompleted(true);
                    // Automáticamente pasar al siguiente ejercicio después de 1.5 segundos
                    setTimeout(() => {
                        const nextIndex = currentIndex + 1;

                        // Verificar si completó todos los ejercicios
                        if (nextIndex >= exerciseOptions.length) {
                            setShowCompletionModal(true);
                        } else {
                            setCurrentIndex(nextIndex);
                            setSelectedLetters([]);
                            setLetterStates([]);
                            setGameCompleted(false);
                        }
                    }, 1500);
                }, 500);
            }
        }
    };

    const handleRedirectToUnits = () => {
        setLocation('/units');
    };

    const getLetterStyle = (index: number): React.CSSProperties => {
        const baseStyle: React.CSSProperties = {
            width: '48px',
            height: '48px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: '24px',
            fontWeight: 'bold',
            border: '2px solid',
            borderRadius: '8px',
            cursor: letterStates[index] === undefined ? 'pointer' : 'default',
            transition: 'all 0.3s',
            userSelect: 'none'
        };

        if (letterStates[index] === 'correct') {
            return {
                ...baseStyle,
                backgroundColor: '#22c55e',
                borderColor: '#16a34a',
                color: 'white',
                cursor: 'default'
            };
        } else if (letterStates[index] === 'incorrect') {
            return {
                ...baseStyle,
                backgroundColor: '#ef4444',
                borderColor: '#dc2626',
                color: 'white',
                cursor: 'default'
            };
        } else {
            return {
                ...baseStyle,
                backgroundColor: 'white',
                borderColor: '#d1d5db',
                color: '#1f2937'
            };
        }
    };

    return (
        <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px',
            padding: '8px'
        }}>
            {/* Contenedor único para imagen y letras */}
            <div style={{
                width: '100%',
                maxWidth: '100%',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                alignItems: 'center'
            }}>
                {/* Imagen */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <img
                        src={currentExercise.image}
                        alt={currentExercise.label}
                        style={{
                            width: '70%',
                            maxWidth: '500px',
                            height: '160px',
                            objectFit: 'contain',
                            borderRadius: '8px'
                        }}
                    />
                </div>

                {/* Letras */}
                <div style={{
                    width: '100%',
                    display: 'flex',
                    justifyContent: 'center',
                    alignItems: 'center'
                }}>
                    <div style={{
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        gap: '8px',
                        flexWrap: 'wrap',
                        maxWidth: '100%'
                    }}>
                        {letters.map((letter, index) => (
                            <button
                                key={index}
                                onClick={() => checkLetter(index, letter)}
                                disabled={letterStates[index] !== undefined}
                                style={getLetterStyle(index)}
                                onMouseOver={(e) => {
                                    if (letterStates[index] === undefined) {
                                        e.currentTarget.style.borderColor = '#0891b2';
                                        e.currentTarget.style.transform = 'scale(1.05)';
                                    }
                                }}
                                onMouseOut={(e) => {
                                    if (letterStates[index] === undefined) {
                                        e.currentTarget.style.borderColor = '#d1d5db';
                                        e.currentTarget.style.transform = 'scale(1)';
                                    }
                                }}
                            >
                                {letter}
                            </button>
                        ))}
                    </div>
                </div>

                {/* Mensaje de felicitación temporal */}
                {gameCompleted && !showCompletionModal && (
                    <div style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        transform: 'translate(-50%, -50%)',
                        textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.95)',
                        padding: '20px',
                        borderRadius: '12px',
                        zIndex: 10
                    }}>
                        <div style={{
                            fontSize: '36px',
                            marginBottom: '8px',
                            animation: 'bounce 1s infinite'
                        }}>
                            🎉
                        </div>
                        <h2 style={{
                            fontSize: '18px',
                            fontWeight: 'bold',
                            color: '#22c55e',
                            marginBottom: '8px'
                        }}>
                            ¡Excelente trabajo!
                        </h2>
                    </div>
                )}

                {/* Modal de finalización de todos los ejercicios */}
                {showCompletionModal && (
                    <div style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        backgroundColor: 'rgba(0, 0, 0, 0.7)',
                        display: 'flex',
                        justifyContent: 'center',
                        alignItems: 'center',
                        zIndex: 1000
                    }}>
                        <div style={{
                            backgroundColor: 'white',
                            borderRadius: '16px',
                            padding: '32px',
                            maxWidth: '400px',
                            textAlign: 'center',
                            boxShadow: '0 10px 25px rgba(0,0,0,0.2)'
                        }}>
                            <div style={{
                                fontSize: '64px',
                                marginBottom: '16px',
                                animation: 'bounce 1s infinite'
                            }}>
                                🎊
                            </div>
                            <h2 style={{
                                fontSize: '24px',
                                fontWeight: 'bold',
                                color: '#1f2937',
                                marginBottom: '12px'
                            }}>
                                ¡Felicitaciones!
                            </h2>
                            <p style={{
                                fontSize: '16px',
                                color: '#6b7280',
                                marginBottom: '24px',
                                lineHeight: '1.5'
                            }}>
                                Has completado el último ejercicio de esta unidad. Serás redirigido a la vista de unidades.
                            </p>
                            <button
                                onClick={handleRedirectToUnits}
                                style={{
                                    backgroundColor: '#0891b2',
                                    color: 'white',
                                    padding: '12px 32px',
                                    borderRadius: '12px',
                                    border: 'none',
                                    fontSize: '16px',
                                    fontWeight: '600',
                                    cursor: 'pointer',
                                    transition: 'all 0.2s',
                                    width: '100%'
                                }}
                                onMouseOver={(e) => {
                                    e.currentTarget.style.backgroundColor = '#0e7490';
                                    e.currentTarget.style.transform = 'scale(1.02)';
                                }}
                                onMouseOut={(e) => {
                                    e.currentTarget.style.backgroundColor = '#0891b2';
                                    e.currentTarget.style.transform = 'scale(1)';
                                }}
                            >
                                Ir a Unidades
                            </button>
                        </div>
                    </div>
                )}
            </div>

            <style>{`
        @keyframes bounce {
          0%, 100% {
            transform: translateY(0);
          }
          50% {
            transform: translateY(-20px);
          }
        }
      `}</style>
        </div>
    );
}