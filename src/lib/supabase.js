import { supabase } from './lib/supabase'

async function test() {
  const { data, error } = await supabase.from('Festa').select()
  console.log('Dados:', data)
  console.log('Erro:', error)
}

test()
