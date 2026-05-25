import { ApolloServer} from "@apollo/server";
import {startStandaloneServer} from "@apollo/server/standalone";


//Определение схемы
const typeDefs = `#graphql
  # Тип Author (Автор)
  type Author {
    id: ID!
    name: String!
    email: String
    books: [Book!]!
  }

  # Тип Book (Книга)
  type Book {
    id: ID!
    title: String!
    genre: String
    publishedYear: Int
    author: Author!
  }

  # Входной тип для создания автора
  input CreateAuthorInput {
    name: String!
    email: String
  }

  # Входной тип для создания книги
  input CreateBookInput {
    title: String!
    genre: String
    publishedYear: Int
    authorId: ID!
  }

  # Тип Query (операции чтения)
  type Query {
    # Получить всех авторов
    authors: [Author!]!
    # Получить автора по id
    author(id: ID!): Author
    
    # Получить все книги
    books: [Book!]!
    # Получить книгу по id
    book(id: ID!): Book
  }

  # Тип Mutation (операции изменения)
  type Mutation {
    # Создать автора
    createAuthor(input: CreateAuthorInput!): Author!
    
    # Создать книгу
    createBook(input: CreateBookInput!): Book!
  }
`;

// Данные в памяти
const authors = [
    {id: '1', name: 'Лев Толстой', email: 'tolstoy@classic.ru'},
    {id: '2', name: 'Федор Достоевский', email: 'dostoevsky@classic.ru'}
];

const books = [
    {
        id: '1',
        title: 'Войны и мир',
        genre: 'Роман-эпопея',
        publishedYear: 1869,
        authorId: '1'
    },
    {
        id: '2',
        title: 'Анна Каренина',
        genre: 'Роман',
        publishedYear: 1877,
        authorId: '1'
    },
    {
        id: '3',
        title: 'Преступление и наказание',
        genre: 'Роман',
        publishedYear: 1866,
        authorId: '2'
    }
];

//Определяем резолверы

const resolvers = {
    Query: {
        authors: () => authors,
        author: (_, {id}) => authors.find(a => a.id === id),
        books: () => books,
        book: (_, {id}) => books.find(b => b.id === id),
    },
    Mutation: {
        createAuthor: (_, {input}) => {
            const newAuthor = {
                id: String(authors.length + 1),
                name: input.name,
                email: input.email || null,
            };
            authors.push(newAuthor);
            return newAuthor;
        },
        createBook: (_, {input}) => {
            const author = authors.find(a => a.id === input.authorId);
            if (!author)
                throw new Error(`Автор с id ${input.authorId} не найден`);
            const newBook = {
                id: String(books.length + 1),
                title: input.title,
                genre: input.genre || null,
                publishedYear: input.publishedYear || null,
                authorId: input.authorId
            };
            books.push(newBook);
            return newBook;
        }
    },

    //Вложенные резолверы для связей между типами
    Author: {
        books: (parent) => {
            return books.filter(b => b.authorId === parent.id);
        }
    },
    Book: {
        author: (parent) => {
            return authors.find(a => a.id === parent.authorId);
        }
    }
};

const server = new ApolloServer({
    typeDefs,
    resolvers,
    csrfPrevention: false
});

const { url} = await startStandaloneServer(server, {
    listen: {port: 4000}
});

console.log(`GraphQL Server ready at: ${url}`);
console.log(`Apollo Sandbox доступен по адресу: ${url}`);