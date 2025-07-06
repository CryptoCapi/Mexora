import React, { useState, ChangeEvent } from 'react';
import styled from 'styled-components';

const CaptchaContainer = styled.div`
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20px;
  background: rgba(0, 0, 0, 0.8);
  border-radius: 10px;
  color: white;
`;

const ThanosImage = styled.img`
  width: 200px;
  height: 200px;
  margin: 20px 0;
`;

const Input = styled.input`
  padding: 10px;
  margin: 10px 0;
  border: 2px solid #9370DB;
  border-radius: 5px;
  background: transparent;
  color: white;
  width: 250px;
  
  &:focus {
    outline: none;
    border-color: #483D8B;
  }
`;

const Button = styled.button`
  padding: 10px 20px;
  background: #9370DB;
  border: none;
  border-radius: 5px;
  color: white;
  cursor: pointer;
  font-weight: bold;
  
  &:hover {
    background: #483D8B;
  }
`;

interface MessageProps {
  isError: boolean;
}

const Message = styled.p<MessageProps>`
  color: ${props => props.isError ? '#ff0000' : '#4CAF50'};
  margin-top: 10px;
`;

interface ThanosCaptchaProps {
  onVerify: (success: boolean) => void;
}

const correctPhrases = [
  'equilibrio',
  'balance',
  'inevitable',
  'destino',
  'thanos',
  'poder',
  'perfecto',
  'universal'
];

export const ThanosCaptcha: React.FC<ThanosCaptchaProps> = ({ onVerify }) => {
  const [mood, setMood] = useState<'neutral' | 'happy' | 'angry'>('neutral');
  const [input, setInput] = useState('');
  const [message, setMessage] = useState('');
  const [attempts, setAttempts] = useState(0);

  const handleVerify = () => {
    const userInput = input.toLowerCase().trim();
    const isCorrect = correctPhrases.some(phrase => userInput.includes(phrase));

    if (isCorrect) {
      setMood('happy');
      setMessage('¡Has complacido a Thanos! Acceso concedido.');
      onVerify(true);
    } else {
      setAttempts(prev => prev + 1);
      if (attempts >= 2) {
        setMood('angry');
        setMessage('¡Has enfurecido a Thanos! Intenta con palabras como: equilibrio, balance, poder...');
      } else {
        setMessage('Esa frase no complace a Thanos. Intenta con palabras como: equilibrio, balance, poder...');
      }
      onVerify(false);
    }
  };

  const handleInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    setInput(e.target.value);
    setMessage('');
    setMood('neutral');
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleVerify();
    }
  };

  return (
    <CaptchaContainer>
      <h2>Complace a Thanos para acceder a Mexora</h2>
      <ThanosImage 
        src={`/assets/thanos-${mood}.svg`} 
        alt={`Thanos ${mood}`} 
      />
      <p>Ingresa una frase que haría feliz a Thanos:</p>
      <Input
        type="text"
        value={input}
        onChange={handleInputChange}
        onKeyPress={handleKeyPress}
        placeholder="Escribe palabras como: equilibrio, balance, poder..."
      />
      {message && <Message isError={mood === 'angry'}>{message}</Message>}
      <Button onClick={handleVerify}>Verificar</Button>
    </CaptchaContainer>
  );
};

export default ThanosCaptcha; 