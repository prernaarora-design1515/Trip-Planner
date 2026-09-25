export function waLink(message: string): string {
  return `https://wa.me/?text=${encodeURIComponent(message)}`;
}

export function nudgeMessage(tripName: string, friendName: string, shareUrl: string): string {
  return `Hey ${friendName}! We're still waiting on your preferences for "${tripName}" — takes 60 seconds and unlocks the trip options for everyone \u{1F447}\n${shareUrl}`;
}

export function tripOnMessage(tripName: string, destination: string, shareUrl: string): string {
  return `It's official — "${tripName}" is happening in ${destination}! \u{1F389} Everyone locked their vote. Details here:\n${shareUrl}`;
}
