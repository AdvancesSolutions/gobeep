import { render, act, screen, fireEvent } from "@testing-library/react";
import UserProfile from "../UserProfile";
import { vi, describe, it, expect, beforeEach } from "vitest";

// Mock ResizeObserver which is not available in jsdom
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

const mockToast = vi.fn();

vi.mock("@/hooks/use-toast", () => ({
  useToast: () => ({
    toast: mockToast,
  }),
}));

vi.mock("@/contexts/PointsContext", () => ({
  usePoints: () => ({
    totalPoints: 100,
  }),
}));

// Mock framer-motion to avoid issues with animations in tests
vi.mock("framer-motion", () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    h1: ({ children, ...props }: any) => <h1 {...props}>{children}</h1>,
    h2: ({ children, ...props }: any) => <h2 {...props}>{children}</h2>,
    span: ({ children, ...props }: any) => <span {...props}>{children}</span>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
    section: ({ children, ...props }: any) => <section {...props}>{children}</section>,
    p: ({ children, ...props }: any) => <p {...props}>{children}</p>,
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
  useAnimation: () => ({
    start: vi.fn(),
    stop: vi.fn(),
  }),
  useScroll: () => ({ scrollY: { onChange: vi.fn() } }),
  useTransform: () => ({}),
}));

vi.mock("lucide-react", () => ({
  User: () => <div data-testid="icon-user" />,
  Sun: () => <div data-testid="icon-sun" />,
  Moon: () => <div data-testid="icon-moon" />,
  ChevronRight: () => <div data-testid="icon-chevron" />,
  Edit3: () => <div data-testid="icon-edit" />,
  LogOut: () => <div data-testid="icon-logout" />,
  Bell: () => <div data-testid="icon-bell" />,
  Shield: () => <div data-testid="icon-shield" />,
  HelpCircle: () => <div data-testid="icon-help" />,
  Star: () => <div data-testid="icon-star" />,
  Trophy: () => <div data-testid="icon-trophy" />,
  Camera: () => <div data-testid="icon-camera" />,
  Eye: () => <div data-testid="icon-eye" />,
  EyeOff: () => <div data-testid="icon-eyeoff" />,
  ShieldCheck: () => <div data-testid="icon-shieldcheck" />,
  Smartphone: () => <div data-testid="icon-smartphone" />,
  Mail: () => <div data-testid="icon-mail" />,
  MessageSquare: () => <div data-testid="icon-messagesquare" />,
  KeyRound: () => <div data-testid="icon-keyround" />,
  CheckCircle2: () => <div data-testid="icon-checkcircle" />,
  Circle: () => <div data-testid="icon-circle" />,
  Download: () => <div data-testid="icon-download" />,
  LayoutGrid: () => <div data-testid="icon-layoutgrid" />,
  Search: () => <div data-testid="icon-search" />,
  ArrowUpDown: () => <div data-testid="icon-arrowupdown" />,
  SortAsc: () => <div data-testid="icon-sortasc" />,
  SortDesc: () => <div data-testid="icon-sortdesc" />,
}));

vi.mock("@/components/ui/dropdown-menu", () => ({
  DropdownMenu: ({ children }: any) => <>{children}</>,
  DropdownMenuTrigger: ({ children }: any) => <>{children}</>,
  DropdownMenuContent: ({ children }: any) => <>{children}</>,
  DropdownMenuItem: ({ children, onClick }: any) => (
    <button onClick={onClick}>
      {children}
    </button>
  ),
  DropdownMenuLabel: ({ children }: any) => <div>{children}</div>,
  DropdownMenuSeparator: () => <hr />,
}));

describe("UserProfile Sort Order", () => {
  beforeEach(() => {
    localStorage.clear();
    mockToast.mockClear();
    vi.clearAllMocks();
  });

  it("resets invalid sort order and shows toast", () => {
    localStorage.setItem("beep_bet_sort_order", "invalid-value");
    
    render(<UserProfile onNavigate={() => {}} />);

    // Check if localStorage was cleared
    expect(localStorage.getItem("beep_bet_sort_order")).toBe("recent");
    
    // Check if toast was called
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Ordenação resetada",
      description: expect.stringContaining("valor inválido"),
      variant: "destructive",
    }));
  });

  it("clears localStorage when invalid value is detected to avoid repeated notifications", () => {
    localStorage.setItem("beep_bet_sort_order", "wrong");
    
    render(<UserProfile onNavigate={() => {}} />);
    
    expect(localStorage.getItem("beep_bet_sort_order")).toBe("recent");
    expect(mockToast).toHaveBeenCalledTimes(1);
  });

  it("syncs sort order and updates state when localStorage changes in another tab", () => {
    const { rerender } = render(<UserProfile onNavigate={() => {}} />);
    
    // Simulate storage event from another tab
    act(() => {
      localStorage.setItem("beep_bet_sort_order", "oldest");
      window.dispatchEvent(new StorageEvent("storage", {
        key: "beep_bet_sort_order",
        newValue: "oldest",
      }));
    });

    // Check if it handles invalid value from another tab too
    act(() => {
      localStorage.setItem("beep_bet_sort_order", "malicious-value");
      window.dispatchEvent(new StorageEvent("storage", {
        key: "beep_bet_sort_order",
        newValue: "malicious-value",
      }));
    });

    expect(localStorage.getItem("beep_bet_sort_order")).toBe("recent");
    expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
      title: "Ordenação resetada",
      variant: "destructive",
    }));
  });

  it.each([
    ["recent"],
    ["oldest"],
    ["name-asc"],
    ["name-desc"]
  ])("does NOT show notification and maintains value when sort order is '%s'", (validOrder) => {
    localStorage.setItem("beep_bet_sort_order", validOrder);
    
    render(<UserProfile onNavigate={() => {}} />);

    expect(localStorage.getItem("beep_bet_sort_order")).toBe(validOrder);
    expect(mockToast).not.toHaveBeenCalled();
  });

  it("persists sort order to localStorage when changed in the UI", () => {
    render(<UserProfile onNavigate={() => {}} />);
    
    // Ensure the sort button exists
    expect(screen.getByTitle("Opções de ordenação")).toBeDefined();
    
    const oldestOption = screen.getByText("Mais antigas primeiro");
    fireEvent.click(oldestOption);
    
    // Verify it was persisted
    expect(localStorage.getItem("beep_bet_sort_order")).toBe("oldest");
  });

  it("loads the saved sort order from localStorage on initial render", () => {
    localStorage.setItem("beep_bet_sort_order", "name-desc");
    
    render(<UserProfile onNavigate={() => {}} />);
    
    // The state should be initialized with the value from localStorage
    // We can verify this by checking if it doesn't get reset to 'recent'
    expect(localStorage.getItem("beep_bet_sort_order")).toBe("name-desc");
    expect(mockToast).not.toHaveBeenCalled();
  });

  describe("List Sorting and Filtering", () => {
    const mockBets = [
      { id: "bet-recent", apostaId: "aposta-z", status: "pendente", data: "2024-05-01T10:00:00Z", valor: 10, retornoPotencial: 20 },
      { id: "bet-oldest", apostaId: "aposta-a", status: "pendente", data: "2024-01-01T10:00:00Z", valor: 10, retornoPotencial: 20 }
    ];

    const mockApostas = [
      { id: "aposta-a", titulo: "Aposta A", emissora: "Alpha TV", opcoes: [] },
      { id: "aposta-z", titulo: "Aposta Z", emissora: "Zebra TV", opcoes: [] }
    ];

    beforeEach(() => {
      localStorage.setItem("beep_user_bets", JSON.stringify(mockBets));
      localStorage.setItem("beep_apostas", JSON.stringify(mockApostas));
    });

    it("sorts by recent (default)", () => {
      render(<UserProfile onNavigate={() => {}} />);
      
      const titles = screen.getAllByText(/Aposta [AZ]/).map(el => el.textContent);
      // 'recent' should show 2024-05-01 first, then 2024-01-01
      expect(titles[0]).toBe("Aposta Z");
      expect(titles[1]).toBe("Aposta A");
    });

    it("sorts by oldest when selected", () => {
      render(<UserProfile onNavigate={() => {}} />);
      
      const sortButton = screen.getByTitle("Opções de ordenação");
      fireEvent.click(sortButton);
      
      const oldestOption = screen.getByText("Mais antigas primeiro");
      fireEvent.click(oldestOption);
      
      const titles = screen.getAllByText(/Aposta [AZ]/).map(el => el.textContent);
      expect(titles[0]).toBe("Aposta A");
      expect(titles[1]).toBe("Aposta Z");
    });

    it("sorts by name-asc (broadcaster name)", () => {
      render(<UserProfile onNavigate={() => {}} />);
      
      const sortButton = screen.getByTitle("Opções de ordenação");
      fireEvent.click(sortButton);
      
      const nameAscOption = screen.getByText("A-Z (Ordem alfabética)");
      fireEvent.click(nameAscOption);
      
      const broadcasters = screen.getAllByText(/[AZ].* TV/).map(el => el.textContent);
      expect(broadcasters[0]).toBe("Alpha TV");
      expect(broadcasters[1]).toBe("Zebra TV");
    });

    it("sorts by name-desc (broadcaster name)", () => {
      render(<UserProfile onNavigate={() => {}} />);
      
      const sortButton = screen.getByTitle("Opções de ordenação");
      fireEvent.click(sortButton);
      
      const nameDescOption = screen.getByText("Z-A (Ordem inversa)");
      fireEvent.click(nameDescOption);
      
      const broadcasters = screen.getAllByText(/[AZ].* TV/).map(el => el.textContent);
      expect(broadcasters[0]).toBe("Zebra TV");
      expect(broadcasters[1]).toBe("Alpha TV");
    });

    it("filters the list by broadcaster name", () => {
      render(<UserProfile onNavigate={() => {}} />);
      
      const filterInput = screen.getByPlaceholderText("Filtrar por emissora...");
      fireEvent.change(filterInput, { target: { value: "Alpha" } });
      
      expect(screen.queryByText("Aposta Z")).toBeNull();
      expect(screen.getByText("Aposta A")).toBeDefined();
    });
  });
});