defmodule Mix.Tasks.Common do
  use Mix.Task

  @shortdoc "Simply runs the Hello.say/0 function"
  def run(_) do
    IO.puts "Going to watch the javascript code"
    GenServer.start(Watcher, dirs: ["./common"])
    IO.puts "Watching the javascript code"
  end
end
