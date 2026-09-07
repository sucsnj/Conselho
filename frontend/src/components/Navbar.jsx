import React from 'react';
import { Crown, Swords, Users, Shield, Lock, LogOut, RefreshCw } from 'lucide-react';
import { useCourt } from '../context/CourtContext';

export default function Navbar({ onOpenAdmin, onOpenCheckIn }) {
  const { currentParticipant, participants, refreshParticipants, leaveCourt, apiOnline } = useCourt();

  return (
    <header className="sticky top-0 z-40 bg-obsidian-900/90 backdrop-blur-md border-b border-gold-600/30 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between gap-3">
        {/* Brasão e Título */}
        <div className="flex items-center gap-3 cursor-pointer select-none" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
          <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-royal-900 border border-gold-500/50 shadow-gold-glow">
            <Crown className="w-6 h-6 text-gold-400 royal-float" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-medieval text-gold-400 text-lg sm:text-xl font-bold tracking-wider medieval-title-glow">
                A CORTE DE ADS
              </span>
              <span className="hidden sm:inline-block text-xs uppercase px-1.5 py-0.5 rounded bg-royal-800 text-gold-300 border border-gold-600/30">
                Festa Real
              </span>
            </div>
            <p className="text-[11px] text-parchment-400 font-heading tracking-wide hidden sm:block">
              Decretos, Votações & Destinos da Turma
            </p>
          </div>
        </div>

        {/* Status de Participantes e Combatente Ativo */}
        <div className="flex items-center gap-2 sm:gap-3">
          {/* Badge de Combatentes Alistados */}
          <button
            onClick={refreshParticipants}
            title="Clique para atualizar lista de combatentes"
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-md bg-obsidian-800 border border-gold-600/30 text-xs text-parchment-200 hover:border-gold-500 transition-colors group"
          >
            <span className="relative flex h-2 w-2">
              <span className={`animate-ping absolute inline-flex h-full w-full rounded-full opacity-75 ${apiOnline ? 'bg-emerald-400' : 'bg-red-400'}`}></span>
              <span className={`relative inline-flex rounded-full h-2 w-2 ${apiOnline ? 'bg-emerald-500' : 'bg-red-500'}`}></span>
            </span>
            <Users className="w-3.5 h-3.5 text-gold-400 group-hover:rotate-12 transition-transform" />
            <span className="font-medium">{participants.length}</span>
            <span className="hidden md:inline text-parchment-400">combatentes</span>
            <RefreshCw className="w-3 h-3 text-parchment-400 opacity-60 group-hover:opacity-100 group-hover:rotate-180 transition-all ml-0.5" />
          </button>

          {/* Combatente Logado ou Botão de Alistamento */}
          {currentParticipant ? (
            <div className="flex items-center gap-2 bg-royal-950/80 border border-gold-500/40 rounded-lg px-2.5 py-1">
              <div className="text-right hidden sm:block">
                <div className="text-xs font-heading font-bold text-gold-300 max-w-[140px] truncate">
                  {currentParticipant.name}
                </div>
                <div className="text-[10px] text-parchment-400 max-w-[140px] truncate">
                  {currentParticipant.title}
                </div>
              </div>
              <button
                onClick={leaveCourt}
                title="Trocar de combatente (sair)"
                className="p-1.5 text-parchment-400 hover:text-gold-300 hover:bg-royal-800 rounded transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={onOpenCheckIn}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gradient-to-r from-gold-600 to-gold-500 text-obsidian-950 font-heading font-bold text-xs shadow-gold-glow hover:brightness-110 active:scale-95 transition-all"
            >
              <Swords className="w-3.5 h-3.5" />
              <span>Alistar-se</span>
            </button>
          )}

          {/* Botão Cofre da Coroa (Admin) */}
          <button
            onClick={onOpenAdmin}
            title="Cofre da Coroa (Painel do Mestre / Telão)"
            className="flex items-center gap-1 px-2.5 py-1.5 rounded-md bg-royal-900/80 border border-royal-600 text-gold-400 hover:bg-royal-800 hover:border-gold-500 transition-colors text-xs font-heading font-semibold"
          >
            <Lock className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Cofre</span>
          </button>
        </div>
      </div>
    </header>
  );
}
