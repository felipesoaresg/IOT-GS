import { useState, useEffect, useRef } from 'react';
import mqtt from 'mqtt';
import './App.css';

function App() {
  const [tab, setTab] = useState('tarefas');
  const [mqttStatus, setMqttStatus] = useState('Conectando...');
  const clientRef = useRef(null);
  
  const [tarefas, setTarefas] = useState([
    { id: 1, texto: 'Revisar relatório', feita: false },
    { id: 2, texto: 'Responder e-mails', feita: false },
  ]);
  const [novaTarefa, setNovaTarefa] = useState('');
  
  const [lembretes, setLembretes] = useState([
    { id: 1, texto: 'Reunião 14h', hora: '13:45' },
    { id: 2, texto: 'Tomar água', hora: '10:00' },
  ]);
  const [novoLembrete, setNovoLembrete] = useState('');
  const [horaLembrete, setHoraLembrete] = useState('');
  
  const [minutos, setMinutos] = useState(25);
  const [segundos, setSegundos] = useState(0);
  const [timerAtivo, setTimerAtivo] = useState(false);
  
  const [mostrarCrise, setMostrarCrise] = useState(false);
  const [passoCrise, setPassoCrise] = useState(0);
  const [alertaCrise, setAlertaCrise] = useState(false);

  // Conectar MQTT
  useEffect(() => {
    try {
      const client = mqtt.connect('wss://broker.hivemq.com:8884/mqtt');
      clientRef.current = client;
      
      client.on('connect', () => {
        console.log('MQTT Conectado!');
        setMqttStatus('Conectado');
        client.subscribe('wellwork/crisis');
        client.subscribe('wellwork/status');
      });
      
      client.on('error', (err) => {
        console.log('MQTT Erro:', err);
        setMqttStatus('Erro');
      });
      
      client.on('offline', () => {
        setMqttStatus('Desconectado');
      });
      
      client.on('message', (topic, message) => {
        console.log('Mensagem recebida:', topic, message.toString());
        if (topic === 'wellwork/crisis') {
          setAlertaCrise(true);
          setMostrarCrise(true);
          setPassoCrise(0);
        }
      });
      
      return () => {
        if (client) client.end();
      };
    } catch (err) {
      console.log('Erro ao conectar MQTT:', err);
      setMqttStatus('Erro');
    }
  }, []);

  // Função para enviar MQTT
  const enviarMQTT = (topico, dados) => {
    if (clientRef.current && clientRef.current.connected) {
      clientRef.current.publish(topico, JSON.stringify(dados));
      console.log('Enviado:', topico, dados);
    } else {
      console.log('MQTT não conectado');
    }
  };

  // Timer
  useEffect(() => {
    let interval = null;
    if (timerAtivo) {
      interval = setInterval(() => {
        setSegundos((seg) => {
          if (seg === 0) {
            setMinutos((min) => {
              if (min === 0) {
                setTimerAtivo(false);
                enviarMQTT('wellwork/timer', { acao: 'fim' });
                return 0;
              }
              return min - 1;
            });
            return 59;
          }
          return seg - 1;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [timerAtivo]);

  const iniciarTimer = () => {
    setTimerAtivo(true);
    enviarMQTT('wellwork/timer', { acao: 'iniciar', minutos: minutos });
  };

  const pararTimer = () => {
    setTimerAtivo(false);
    enviarMQTT('wellwork/timer', { acao: 'parar' });
  };

  const resetarTimer = (mins) => {
    setTimerAtivo(false);
    setMinutos(mins);
    setSegundos(0);
  };

  const adicionarTarefa = () => {
    if (novaTarefa.trim()) {
      setTarefas([...tarefas, { id: Date.now(), texto: novaTarefa, feita: false }]);
      setNovaTarefa('');
    }
  };

  const toggleTarefa = (id) => {
    setTarefas(tarefas.map(t => t.id === id ? { ...t, feita: !t.feita } : t));
  };

  const deletarTarefa = (id) => {
    setTarefas(tarefas.filter(t => t.id !== id));
  };

  const enviarLembrete = (texto) => {
    enviarMQTT('wellwork/reminder', { texto: texto });
    alert('Lembrete enviado: ' + texto);
  };

  const adicionarLembrete = () => {
    if (novoLembrete.trim() && horaLembrete) {
      setLembretes([...lembretes, { id: Date.now(), texto: novoLembrete, hora: horaLembrete }]);
      setNovoLembrete('');
      setHoraLembrete('');
    }
  };

  const deletarLembrete = (id) => {
    setLembretes(lembretes.filter(l => l.id !== id));
  };

  const passosCrise = [
    { titulo: '🌬️ Respire', texto: 'Inspire por 4 segundos, segure 4, expire 4.' },
    { titulo: '👀 Observe', texto: 'Nomeie 5 coisas que você vê ao redor.' },
    { titulo: '✋ Toque', texto: 'Sinta a textura de algo próximo.' },
    { titulo: '👂 Ouça', texto: 'Identifique 3 sons no ambiente.' },
    { titulo: '💙 Afirme', texto: 'Diga: "Isso vai passar. Estou seguro(a)."' },
  ];

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <h1>💼 WellWork</h1>
        <p>Assistente de Produtividade Inclusivo</p>
      </header>

      {/* Botão de Crise - Sempre Visível */}
      <button 
        className={`btn-crise ${alertaCrise ? 'alerta' : ''}`} 
        onClick={() => { setMostrarCrise(true); setPassoCrise(0); }}
      >
        🆘 Preciso de Ajuda
      </button>

      {/* Modal de Crise */}
      {mostrarCrise && (
        <div className="modal-overlay">
          <div className="modal">
            {alertaCrise && (
              <div className="alerta-msg">⚠️ Alerta recebido do dispositivo</div>
            )}
            <h2>{passosCrise[passoCrise].titulo}</h2>
            <p>{passosCrise[passoCrise].texto}</p>
            
            <div className="passos-indicador">
              {passosCrise.map((_, i) => (
                <span key={i} className={`passo ${i <= passoCrise ? 'ativo' : ''}`}></span>
              ))}
            </div>
            
            <div className="modal-btns">
              {passoCrise > 0 && (
                <button onClick={() => setPassoCrise(passoCrise - 1)}>Anterior</button>
              )}
              {passoCrise < 4 ? (
                <button className="btn-primary" onClick={() => setPassoCrise(passoCrise + 1)}>
                  Próximo
                </button>
              ) : (
                <button 
                  className="btn-success" 
                  onClick={() => { setMostrarCrise(false); setAlertaCrise(false); }}
                >
                  Estou Melhor
                </button>
              )}
            </div>
            <button 
              className="btn-fechar" 
              onClick={() => { setMostrarCrise(false); setAlertaCrise(false); }}
            >
              Fechar
            </button>
          </div>
        </div>
      )}

      {/* Navegação */}
      <nav className="nav">
        <button 
          className={tab === 'tarefas' ? 'ativo' : ''} 
          onClick={() => setTab('tarefas')}
        >
          📝 Tarefas
        </button>
        <button 
          className={tab === 'lembretes' ? 'ativo' : ''} 
          onClick={() => setTab('lembretes')}
        >
          🔔 Lembretes
        </button>
        <button 
          className={tab === 'timer' ? 'ativo' : ''} 
          onClick={() => setTab('timer')}
        >
          ⏱️ Timer
        </button>
      </nav>

      {/* Conteúdo */}
      <main className="conteudo">
        
        {/* TAREFAS */}
        {tab === 'tarefas' && (
          <div className="card">
            <h2>📝 Minhas Tarefas</h2>
            <div className="input-grupo">
              <input
                type="text"
                value={novaTarefa}
                onChange={(e) => setNovaTarefa(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && adicionarTarefa()}
                placeholder="Nova tarefa..."
              />
              <button onClick={adicionarTarefa}>+</button>
            </div>
            <ul className="lista">
              {tarefas.map((t) => (
                <li key={t.id} className={t.feita ? 'feita' : ''}>
                  <input 
                    type="checkbox" 
                    checked={t.feita} 
                    onChange={() => toggleTarefa(t.id)} 
                  />
                  <span>{t.texto}</span>
                  <button className="btn-delete" onClick={() => deletarTarefa(t.id)}>✕</button>
                </li>
              ))}
            </ul>
            {tarefas.length === 0 && (
              <p style={{textAlign: 'center', color: '#999'}}>Nenhuma tarefa ainda</p>
            )}
          </div>
        )}

        {/* LEMBRETES */}
        {tab === 'lembretes' && (
          <div className="card">
            <h2>🔔 Meus Lembretes</h2>
            <div className="input-grupo">
              <input 
                type="text" 
                value={novoLembrete} 
                onChange={(e) => setNovoLembrete(e.target.value)} 
                placeholder="Lembrete..." 
              />
              <input 
                type="time" 
                value={horaLembrete} 
                onChange={(e) => setHoraLembrete(e.target.value)} 
              />
              <button onClick={adicionarLembrete}>+</button>
            </div>
            <ul className="lista">
              {lembretes.map((l) => (
                <li key={l.id}>
                  <span className="hora">{l.hora}</span>
                  <span>{l.texto}</span>
                  <button className="btn-enviar" onClick={() => enviarLembrete(l.texto)}>📤</button>
                  <button className="btn-delete" onClick={() => deletarLembrete(l.id)}>✕</button>
                </li>
              ))}
            </ul>
            <div className="lembretes-rapidos">
              <p>Lembretes rápidos:</p>
              <button onClick={() => enviarLembrete('Beber água!')}>💧 Água</button>
              <button onClick={() => enviarLembrete('Hora da pausa!')}>☕ Pausa</button>
              <button onClick={() => enviarLembrete('Alongar o corpo!')}>🧘 Alongar</button>
            </div>
          </div>
        )}

        {/* TIMER */}
        {tab === 'timer' && (
          <div className="card timer-card">
            <h2>⏱️ Timer de Foco</h2>
            <div className={`timer-display ${timerAtivo ? 'ativo' : ''}`}>
              {String(minutos).padStart(2, '0')}:{String(segundos).padStart(2, '0')}
            </div>
            <div className="timer-btns">
              {!timerAtivo ? (
                <button className="btn-success" onClick={iniciarTimer}>▶ Iniciar</button>
              ) : (
                <button className="btn-danger" onClick={pararTimer}>⏸ Pausar</button>
              )}
              <button onClick={() => resetarTimer(25)}>🔄 Resetar</button>
            </div>
            <div className="timer-presets">
              <button onClick={() => resetarTimer(15)}>15 min</button>
              <button onClick={() => resetarTimer(25)}>25 min</button>
              <button onClick={() => resetarTimer(45)}>45 min</button>
            </div>
            <p className="dica">💡 Técnica Pomodoro: Foque por 25min, descanse 5min</p>
          </div>
        )}
      </main>

      {/* Status MQTT */}
      <div className="status">
        <span className={`indicador ${mqttStatus === 'Conectado' ? 'online' : ''}`}></span>
        {mqttStatus}
      </div>
    </div>
  );
}

export default App;