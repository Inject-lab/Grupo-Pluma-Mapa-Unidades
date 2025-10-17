import React, { useState, useEffect } from 'react';
import { Search, MapPin, X } from 'lucide-react';
import { geocodeEndereco } from '../services/geocodingService';
import { buscarCidadesSugeridas } from '../data/cidadesParana';

interface CitySearchProps {
  onCityAdd: (city: { name: string; lat: number; lng: number }) => void;
  onClear: () => void;
  selectedCities: { name: string; lat: number; lng: number }[];
  onCityRemove: (cityName: string) => void;
}

export const CitySearch: React.FC<CitySearchProps> = ({ onCityAdd, onClear, selectedCities, onCityRemove }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  // Atualizar sugestões quando o termo de busca muda
  useEffect(() => {
    if (searchTerm.length >= 1) {
      const cidadesSugeridas = buscarCidadesSugeridas(searchTerm);
      setSuggestions(cidadesSugeridas);
      setShowSuggestions(cidadesSugeridas.length > 0);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [searchTerm]);

  const handleSearch = async (cidade?: string) => {
    const termoBusca = cidade || searchTerm;
    if (!termoBusca || !String(termoBusca).trim()) return;

    setIsSearching(true);
    setError(null);
    setShowSuggestions(false);

    try {
      // Adicionar ", Paraná, Brasil" se não estiver presente
      const enderecoCompleto = String(termoBusca).includes('Paraná') 
        ? termoBusca 
        : `${termoBusca}, Paraná, Brasil`;
      
      const result = await geocodeEndereco(enderecoCompleto);
      
      if (result) {
        const cityData = {
          lat: result.latitude,
          lng: result.longitude,
          name: termoBusca
        };
        
        // Verificar se a cidade já está selecionada
        const isAlreadySelected = selectedCities.some(
          city => city.name.toLowerCase() === termoBusca.toLowerCase()
        );
        
        if (isAlreadySelected) {
          setError('Esta cidade já foi adicionada');
          return;
        }
        
        onCityAdd(cityData);
        setSearchTerm('');
      } else {
        setError('Cidade não encontrada');
      }
    } catch (err) {
      setError('Erro ao buscar cidade');
    } finally {
      setIsSearching(false);
    }
  };

  const handleSuggestionClick = (cidade: string) => {
    setSearchTerm(cidade);
    setShowSuggestions(false);
    handleSearch(cidade);
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleClear = () => {
    setSearchTerm('');
    setError(null);
    setShowSuggestions(false);
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-4 mb-4">
      <div className="flex items-center space-x-2 mb-2">
        <MapPin className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          Adicionar Cidades para Investimento
        </h3>
      </div>
      
      <div className="flex space-x-2">
        <div className="flex-1 relative">
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyPress={handleKeyPress}
            onFocus={() => setShowSuggestions(suggestions.length > 0)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            placeholder="Digite o nome da cidade..."
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md 
                     bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                     focus:ring-2 focus:ring-blue-500 focus:border-transparent
                     placeholder-gray-500 dark:placeholder-gray-400"
            disabled={isSearching}
          />
          
          {/* Sugestões */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-md shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((cidade, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestionClick(cidade)}
                  className="w-full text-left px-3 py-2 hover:bg-gray-100 dark:hover:bg-gray-600 
                           text-gray-900 dark:text-white transition-colors duration-150
                           first:rounded-t-md last:rounded-b-md"
                >
                  <div className="flex items-center space-x-2">
                    <MapPin className="h-4 w-4 text-gray-400" />
                    <span>{cidade}</span>
                  </div>
                </button>
              ))}
            </div>
          )}
          
          {isSearching && (
            <div className="absolute right-3 top-2.5">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600"></div>
            </div>
          )}
        </div>
        
        <button
          onClick={() => handleSearch()}
          disabled={isSearching || !searchTerm.trim()}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 
                   text-white rounded-md transition-colors duration-200
                   flex items-center space-x-1"
        >
          <Search className="h-4 w-4" />
          <span>Adicionar</span>
        </button>
      </div>

      {error && (
        <div className="mt-2 text-sm text-red-600 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Lista de cidades selecionadas */}
      {selectedCities.length > 0 && (
        <div className="mt-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Cidades Selecionadas ({selectedCities.length})
          </h4>
          <div className="space-y-2">
            {selectedCities.map((city, index) => (
              <div
                key={`${city.name}-${index}`}
                className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800"
              >
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-blue-600 dark:text-blue-400" />
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    {city.name}
                  </span>
                </div>
                <button
                   onClick={() => onCityRemove(city.name)}
                   className="p-1 text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 transition-colors"
                   title="Remover cidade"
                 >
                  <X className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
          
          {selectedCities.length > 0 && (
            <button
              onClick={onClear}
              className="mt-3 w-full px-4 py-2 text-sm text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 border border-red-200 dark:border-red-800 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
            >
              Limpar Todas as Cidades
            </button>
          )}
        </div>
      )}
    </div>
  );
};