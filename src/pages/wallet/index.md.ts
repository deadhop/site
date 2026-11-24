// Markdown twin of the wallet page, for agents.
import type { APIRoute } from 'astro';
import { wallet } from '../../wallet/content';
import { toolMarkdown } from '../../tool';

export const GET: APIRoute = () => new Response(toolMarkdown(wallet), { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } });
