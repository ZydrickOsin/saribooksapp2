-- Create books table
CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID REFERENCES auth.users NOT NULL,
  title TEXT NOT NULL,
  author TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security
ALTER TABLE books ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own books" 
  ON books FOR SELECT 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own books" 
  ON books FOR INSERT 
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own books" 
  ON books FOR UPDATE 
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own books" 
  ON books FOR DELETE 
  USING (auth.uid() = user_id);
