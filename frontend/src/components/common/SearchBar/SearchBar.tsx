import React, { memo, useState, useCallback } from 'react';
import { Box, TextField, InputAdornment, IconButton } from '@mui/material';
import { Search as SearchIcon, Clear as ClearIcon } from '@mui/icons-material';
import styles from './SearchBar.module.css';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialQuery?: string;
}

const SearchBar = memo<SearchBarProps>(function SearchBar({ onSearch, placeholder = 'Search luxury products...', initialQuery = '' }) {
  const [query, setQuery] = useState(initialQuery);

  const handleChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    setQuery(e.target.value);
    onSearch(e.target.value);
  }, [onSearch]);

  const handleClear = useCallback(() => {
    setQuery('');
    onSearch('');
  }, [onSearch]);

  const handleSubmit = useCallback((e: React.FormEvent) => {
    e.preventDefault();
    onSearch(query);
  }, [onSearch, query]);

  return (
    <Box component="form" onSubmit={handleSubmit} className={styles.root}>
      <TextField
        fullWidth
        variant="outlined"
        placeholder={placeholder}
        value={query}
        onChange={handleChange}
        InputProps={{
          startAdornment: <InputAdornment position="start"><SearchIcon color="action" /></InputAdornment>,
          endAdornment: query ? (
            <InputAdornment position="end">
              <IconButton onClick={handleClear} size="small" aria-label="clear search">
                <ClearIcon />
              </IconButton>
            </InputAdornment>
          ) : null,
        }}
        className={styles.input}
      />
    </Box>
  );
});

export default SearchBar;