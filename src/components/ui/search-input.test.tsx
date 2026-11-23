// @vitest-environment jsdom
import { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { SearchInput } from './search-input';

// @ts-expect-error React 19 test flag
globalThis.IS_REACT_ACT_ENVIRONMENT = true;

describe('SearchInput', () => {
  let container: HTMLDivElement;
  let root: Root;

  beforeEach(() => {
    container = document.createElement('div');
    document.body.appendChild(container);
    root = createRoot(container);
  });

  afterEach(() => {
    act(() => {
      root.unmount();
    });
    container.remove();
  });

  it('renderiza o input de busca sem o botão limpar quando vazio', () => {
    act(() => {
      root.render(<SearchInput value="" onChange={() => {}} placeholder="Buscar..." />);
    });

    const input = container.querySelector('input');
    expect(input).not.toBeNull();
    expect(input?.placeholder).toBe('Buscar...');

    const clearButton = container.querySelector('button[aria-label="Limpar busca"]');
    expect(clearButton).toBeNull();
  });

  it('exibe o botão limpar quando houver texto preenchido', () => {
    act(() => {
      root.render(<SearchInput value="teste" onChange={() => {}} />);
    });

    const clearButton = container.querySelector('button[aria-label="Limpar busca"]');
    expect(clearButton).not.toBeNull();
  });

  it('dispara onClear e onChange vazio ao clicar no botão limpar e restaura o foco no input', () => {
    const handleClear = vi.fn();
    const handleChange = vi.fn();

    act(() => {
      root.render(
        <SearchInput
          value="termo de busca"
          onChange={handleChange}
          onClear={handleClear}
        />,
      );
    });

    const clearButton = container.querySelector(
      'button[aria-label="Limpar busca"]',
    ) as HTMLButtonElement;
    expect(clearButton).not.toBeNull();

    const input = container.querySelector('input') as HTMLInputElement;

    act(() => {
      clearButton.click();
    });

    expect(handleClear).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target.value).toBe('');
    expect(document.activeElement).toBe(input);
  });

  it('limpa e restaura o foco ao pressionar a tecla Escape com texto preenchido', () => {
    const handleClear = vi.fn();
    const handleChange = vi.fn();

    act(() => {
      root.render(
        <SearchInput
          value="termo"
          onChange={handleChange}
          onClear={handleClear}
        />,
      );
    });

    const input = container.querySelector('input') as HTMLInputElement;

    act(() => {
      input.dispatchEvent(
        new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }),
      );
    });

    expect(handleClear).toHaveBeenCalledTimes(1);
    expect(handleChange).toHaveBeenCalledTimes(1);
    expect(handleChange.mock.calls[0][0].target.value).toBe('');
    expect(document.activeElement).toBe(input);
  });
});
