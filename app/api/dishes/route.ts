import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';

const filePath = path.join(process.cwd(), 'data', 'dishes.json');

function readDishes() {
  if (!fs.existsSync(filePath)) {
    fs.mkdirSync(path.dirname(filePath), { recursive: true });
    fs.writeFileSync(filePath, JSON.stringify([
      { id: 1, title: 'Classic Carbonara', description: 'Creamy pasta.', image: 'https://images.unsplash.com/photo-1612874742237-6526221588e3?q=80&w=600&auto=format&fit=crop' },
      { id: 2, title: 'Grilled Salmon', description: 'Perfectly seared.', image: 'https://images.unsplash.com/photo-1485921325833-c519f76c4927?q=80&w=600&auto=format&fit=crop' }
    ]));
  }
  return JSON.parse(fs.readFileSync(filePath, 'utf-8'));
}

function writeDishes(dishes: any[]) {
  fs.writeFileSync(filePath, JSON.stringify(dishes, null, 2));
}

export async function GET() {
  const dishes = readDishes();
  return NextResponse.json(dishes);
}

export async function POST(request: Request) {
  const dishes = readDishes();
  const body = await request.json();
  const newDish = {
    id: Date.now(),
    title: body.title,
    description: body.description,
    image: body.image || 'https://images.unsplash.com/photo-1495195134817-a1a28078aca9?q=80&w=600'
  };
  dishes.push(newDish);
  writeDishes(dishes);
  return NextResponse.json(newDish, { status: 201 });
}

export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  if (id) {
    const dishes = readDishes().filter((dish: any) => dish.id !== parseInt(id));
    writeDishes(dishes);
    return NextResponse.json({ message: 'Deleted' });
  }
  return NextResponse.json({ error: 'ID required' }, { status: 400 });
}
