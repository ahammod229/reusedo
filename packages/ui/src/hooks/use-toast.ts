export function useToast() {
  return {
    toast: (props: unknown) => { console.log("Toast:", props) },
    dismiss: (_toastId?: string) => {},
    toasts: []
  }
}
