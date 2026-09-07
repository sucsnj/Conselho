import React, { useState } from 'react';
import { CourtProvider, useCourt } from './context/CourtContext';
import Navbar from './components/Navbar';
import VotingArena from './pages/VotingArena';
import CheckInModal from './components/CheckInModal';
import AdminModal from './components/AdminModal';
import AdminDashboard from './components/AdminDashboard';
import { Crown } from 'lucide-react';

function AppContent() {
  const { currentParticipant, loading } = useCourt();
  const [isCheckInOpen, setIsCheckInOpen] = useState(false);
  const [isAdminModalOpen, setIsAdminModalOpen] = useState(false);
  const [adminPin, setAdminPin] = useState(() => localStorage.getItem('corte_admin_pin') || '');
  const [isAdminDashboardOpen, setIsAdminDashboardOpen] = useState(false);

  // Se o participante ainda não fez check-in, abre o modal de check-in como primeira experiência
  const showInitialCheckIn = !currentParticipant && !loading;

  const handleOpenAdmin = () => {
    if (adminPin) {
      setIsAdminDashboardOpen(true);
    } else {
      setIsAdminModalOpen(true);
    }
  };

  const handleAdminSuccess = (pin) => {
    setAdminPin(pin);
    setIsAdminDashboardOpen(true);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-obsidian-950 text-parchment-100 p-4">
        <div className="relative flex items-center justify-center w-20 h-20 rounded-2xl bg-royal-900 border-2 border-gold-400 shadow-gold-glow-lg mb-6 royal-float">
          <Crown className="w-10 h-10 text-gold-400" />
        </div>
        <h2 className="font-medieval text-2xl text-gold-400 font-bold medieval-title-glow tracking-wider">
          A Corte de ADS
        </h2>
        <p className="mt-2 text-xs font-heading text-parchment-400 animate-pulse">
          Desfraldando os estandartes e consultando os anais reais...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-obsidian-950">
      {/* Navbar Superior */}
      <Navbar
        onOpenAdmin={handleOpenAdmin}
        onOpenCheckIn={() => setIsCheckInOpen(true)}
      />

      {/* Arena de Votação */}
      <div className="flex-1">
        <VotingArena onOpenCheckIn={() => setIsCheckInOpen(true)} />
      </div>

      {/* Rodapé Real */}
      <footer className="py-6 border-t border-gold-600/20 bg-obsidian-900/60 text-center text-xs text-parchment-500 font-heading">
        <div className="flex items-center justify-center gap-1.5 text-gold-400/80 mb-1">
          <Crown className="w-3.5 h-3.5" />
          <span className="font-bold uppercase tracking-wider">A Corte de ADS</span>
        </div>
        <p>Desenvolvido com honra e tecnologia para a celebração dos formandos.</p>
      </footer>

      {/* Modal de Alistamento (Check-in) */}
      <CheckInModal
        isOpen={isCheckInOpen || showInitialCheckIn}
        onClose={() => setIsCheckInOpen(false)}
        canClose={Boolean(currentParticipant)}
      />

      {/* Modal de Senha do Administrador */}
      <AdminModal
        isOpen={isAdminModalOpen}
        onClose={() => setIsAdminModalOpen(false)}
        onSuccess={handleAdminSuccess}
      />

      {/* Painel do Administrador (Cofre da Coroa) */}
      {isAdminDashboardOpen && (
        <AdminDashboard
          pin={adminPin}
          onClose={() => setIsAdminDashboardOpen(false)}
        />
      )}
    </div>
  );
}

export default function App() {
  return (
    <CourtProvider>
      <AppContent />
    </CourtProvider>
  );
}
