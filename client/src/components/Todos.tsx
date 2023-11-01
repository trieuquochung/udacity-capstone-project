import dateFormat from 'dateformat'
import { History } from 'history'
import update from 'immutability-helper'
import * as React from 'react'
import { Row, Input as Input2, Radio, Col, Typography, Button, Select, Tag, Spin, Space, notification } from 'antd';
import {
  Checkbox, Divider, Grid, Header, Icon, Input, Image
} from 'semantic-ui-react';

import { createTodo, deleteTodo, getTodos, patchTodo } from '../api/todos-api'
import Auth from '../auth/Auth'
import { Todo } from '../types/Todo'

interface TodosProps {
  auth: Auth
  history: History
}
interface TodosState {
  origin_todos: Todo[]
  todos: Todo[]
  newTodoName: string
  loadingTodos: boolean
  priorityLevel: string
  filterValue: string
  statusValue: string
  prioritiesFilter: String[]
}
const { Search } = Input2;

const prioritiesColor: any = {
  Critical: 'red',
  High: 'yellow',
  Normal: 'blue',
  Low: 'gray'
};
export class Todos extends React.PureComponent<TodosProps, TodosState> {
  state: TodosState = {
    origin_todos: [],
    todos: [],
    newTodoName: '',
    loadingTodos: true,
    priorityLevel: "Medium",
    filterValue: '',
    statusValue: 'All',
    prioritiesFilter: [],
  }

  onOpenNotification = (option: string) => {
    switch (option) {
      case 'success': notification.open({
        message: 'Success',
        description:
          'New to do created successfully',
        onClick: () => {
        },
      });
        break;
      case 'exist': notification.open({
        message: 'Error',
        description:
          'Failed to create new to do',
        onClick: () => {
        },
      });
        break;
      default: notification.open({
        message: 'Error',
        description:
          'Error when creating new to do',
        onClick: () => {
        },
      });
    }
  };

  onToDoFilter() {
    const todoListFiltered = this.state.origin_todos.filter((todo: Todo) => {
      if (this.state.statusValue === 'All') {
        return this.state.prioritiesFilter.length ? todo.name.includes(this.state.filterValue)
          && this.state.prioritiesFilter.includes(todo.priorityLevel) : todo.name.includes(this.state.filterValue);
      }
      return todo.name.includes(this.state.filterValue) && (this.state.statusValue === 'Done' ?
        todo.done : !todo.done) && (this.state.prioritiesFilter.length ? this.state.prioritiesFilter.includes(todo.priorityLevel) : true);
    })
    this.setState({ todos: todoListFiltered });
    return todoListFiltered;
  }

  handleNameChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    this.setState({ newTodoName: event.target.value })
  }

  onEditButtonClick = (todoId: string) => {
    this.props.history.push(`/todos/${todoId}/edit`)
  }

  onPriorityChange(event: string) {
    this.setState({
      priorityLevel: event
    })
  }

  onTodoCreate = async (event: React.ChangeEvent<HTMLButtonElement>) => {
    try {
      this.setState({ loadingTodos: true });
      const isToDoExist = this.validateNewTodo(this.state.newTodoName);
      if (isToDoExist || !this.state.newTodoName) {
        this.setState({ loadingTodos: false });
        this.onOpenNotification('existing');
      } else {
        const dueDate = this.calculateDueDate();
        const newTodo = await createTodo(this.props.auth.getIdToken(), {
          name: this.state.newTodoName,
          priorityLevel: this.state.priorityLevel,
          dueDate
        })
        this.setState({
          todos: [...this.state.todos, newTodo],
          newTodoName: '',
          loadingTodos: false
        })
        this.onOpenNotification('success');
      }
    } catch {
      alert('Todo creation failed');
    }
  }

  onTodoDelete = async (todoId: string) => {
    try {
      this.setState({ loadingTodos: true });
      await deleteTodo(this.props.auth.getIdToken(), todoId);
      this.setState({
        todos: this.state.todos.filter(todo => todo.todoId !== todoId),
        loadingTodos: false
      })
    } catch {
      alert('Todo deletion failed');
    }
  }

  onTodoCheck = async (pos: number) => {
    try {
      const todo = this.state.todos[pos]
      this.setState({
        todos: update(this.state.todos, {
          [pos]: { done: { $set: !todo.done } }
        })
      })
      await patchTodo(this.props.auth.getIdToken(), todo.todoId, {
        name: todo.name,
        priorityLevel: todo.priorityLevel,
        dueDate: todo.dueDate,
        done: !todo.done,
        updatedAt: new Date().toLocaleString()
      })
    } catch {
      alert('Todo deletion failed')
    }
  }

  onSearchAllTasks = async (e: any) => {
    this.setState({
      filterValue: e.target.value
    }, this.onToDoFilter);
  }

  onFilterTaskByPrioritiesLevel = async (e: any) => {
    this.setState({ prioritiesFilter: e }, this.onToDoFilter);
  }

  onFilterTaskByStatus = async (e: any) => {
    this.setState({ statusValue: e.target.value }, this.onToDoFilter);
  }

  validateNewTodo = (newTodo: string) => {
    const isExisting = this.state.origin_todos.find((todo: Todo) => {
      return todo.name === newTodo
    })
    return isExisting;
  }

  async componentDidMount() {
    try {
      const todos = await getTodos(this.props.auth.getIdToken());
      this.setState({
        origin_todos: todos,
        todos,
        loadingTodos: false
      });
    } catch (e) {
      alert(`Failed to fetch todos: ${(e as Error).message}`);
    }
  }

  render() {
    return (
      <div>
        <Header as="h1">Task Management</Header>
        {this.renderFilterTasks()}
        {this.renderTaskInput()}
        {this.renderTaskList()}
      </div>
    )
  }

  renderFilterTasks() {
    return (
      <Row justify='center' style={{ 'marginBottom': '40px' }}>
        <Col span={24}>
          <Typography.Paragraph
            style={{ fontWeight: 'bold', marginBottom: 3, marginTop: 10 }}
          >
            Search all tasks by task name
          </Typography.Paragraph>
          <Search placeholder='Enter task name...' value={this.state.filterValue} onChange={(e) => this.onSearchAllTasks(e)} />
        </Col>
        <Col sm={24}>
          <Typography.Paragraph
            style={{ fontWeight: 'bold', marginBottom: 4, marginTop: 8 }}
          >
            Filter task by task priority
          </Typography.Paragraph>
          <Select
            mode='multiple'
            allowClear
            placeholder='Enter task priority...'
            style={{ width: '100%' }}
            onChange={(e) => this.onFilterTaskByPrioritiesLevel(e)}
            value={this.state.prioritiesFilter}
          >
            <Select.Option value='Critical' label='Critical'>
              <Tag color='red'>Critical</Tag>
            </Select.Option>
            <Select.Option value='High' label='High'>
              <Tag color='yellow'>High</Tag>
            </Select.Option>
            <Select.Option value='Normal' label='Normal'>
              <Tag color='blue'>Medium</Tag>
            </Select.Option>
            <Select.Option value='Low' label='Low'>
              <Tag color='gray'>Low</Tag>
            </Select.Option>
          </Select>
        </Col>
        <Col sm={24}>
          <Typography.Paragraph
            style={{ fontWeight: 'bold', marginBottom: 3, marginTop: 10 }}
          >
            Filter task by task status
          </Typography.Paragraph>
          <Radio.Group value={this.state.statusValue} onChange={(e) => this.onFilterTaskByStatus(e)}>
            <Radio value='All'>All</Radio>
            <Radio value='Done'>Done</Radio>
            <Radio value='Todo'>In progress</Radio>
          </Radio.Group>
        </Col>
      </Row>
    )
  }

  renderTaskInput() {
    return (
      <Grid.Row>
        <Grid.Column width={16}>
          <Input
            action={{
              color: 'teal',
              labelPosition: 'left',
              icon: 'add',
              content: 'New task',
              onClick: this.onTodoCreate
            }}
            style={{ 'width': '90%' }}
            actionPosition="left"
            placeholder="Enter new task name..."
            value={this.state.newTodoName}
            onChange={this.handleNameChange}
          />
          <Select value={this.state.priorityLevel} onChange={(e) => this.onPriorityChange(e)} style={{ 'width': '10%', 'borderLeft': 'none', 'height': '39px' }}>
            <Select.Option value='Critical' label='Critical'>
              <Tag color='red'>Critical</Tag>
            </Select.Option>
            <Select.Option value='High' label='High'>
              <Tag color='yellow'>High</Tag>
            </Select.Option>
            <Select.Option value='Normal' label='Normal'>
              <Tag color='blue'>Medium</Tag>
            </Select.Option>
            <Select.Option value='Low' label='Low'>
              <Tag color='gray'>Low</Tag>
            </Select.Option>
          </Select>
        </Grid.Column>
        <Grid.Column width={16}>
          <Divider />
        </Grid.Column>
      </Grid.Row>
    )
  }

  renderTaskList() {
    return (
      <Space direction="vertical" style={{ width: '100%' }}>
        <Spin spinning={this.state.loadingTodos} delay={500} tip="Loading..." size="large">
          <Grid padded>
            {this.state.todos.map((todo, pos) => {
              return (
                <Grid.Row key={todo.todoId} style={{ 'backgroudColor': 'red' }}>
                  <Grid.Column width={1} verticalAlign="middle">
                    <Checkbox
                      onChange={() => this.onTodoCheck(pos)}
                      checked={todo.done}
                    />
                  </Grid.Column>
                  <Grid.Column width={6} verticalAlign="middle">
                    Task Name: {todo.name}
                  </Grid.Column>
                  <Grid.Column width={6} verticalAlign="middle">
                    Task Updated At: {todo.updatedAt}
                  </Grid.Column>
                  <Grid.Column width={2} floated="right" verticalAlign="middle">
                    Task Due Date At: {todo.dueDate}
                  </Grid.Column>
                  <Grid.Column width={2} floated="right" verticalAlign="middle">
                    <Tag color={prioritiesColor[todo.priorityLevel]} style={{ margin: 0, fontSize: '1.2em', padding: '4px 12px' }}>
                      {todo.priorityLevel ? todo.priorityLevel : 'Medium'}
                    </Tag>
                  </Grid.Column>
                  <Grid.Column width={1} floated="right" verticalAlign="middle">
                    <Button
                      icon
                      color="blue"
                      onClick={() => this.onEditButtonClick(todo.todoId)}
                    >
                      <Icon name="pencil" />
                    </Button>
                  </Grid.Column>
                  <Grid.Column width={1} floated="right">
                    <Button
                      icon
                      color="red"
                      onClick={() => this.onTodoDelete(todo.todoId)}
                    >
                      <Icon name="delete" />
                    </Button>
                  </Grid.Column>
                  <Grid.Column width={16} style={{ display: 'flex', justifyContent: 'center' }} verticalAlign="middle">
                    {todo.attachmentUrl && (
                      <Image src={todo.attachmentUrl} size="small" wrapped />
                    )}
                  </Grid.Column>
                  <Grid.Column width={16}>
                    <Divider />
                  </Grid.Column>
                </Grid.Row>
              )
            })}
          </Grid>
        </Spin>
      </Space>
    )
  }

  calculateDueDate(): string {
    const date = new Date();
    date.setDate(date.getDate() + 14);
    return dateFormat(date, 'yyyy-mm-dd') as string
  }
}