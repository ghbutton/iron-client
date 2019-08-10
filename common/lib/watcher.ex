defmodule Watcher do
  use GenServer

  def start_link(args) do
    GenServer.start_link(__MODULE__, args)
  end

  def init(args) do
    {:ok, watcher_pid} = FileSystem.start_link(args)
    FileSystem.subscribe(watcher_pid)
    schedule_work()

    {:ok, %{watcher_pid: watcher_pid, needs_sync: false}}
  end

  def handle_info({:file_event, watcher_pid, {_path, _events}}, %{watcher_pid: watcher_pid} = state) do
    {:noreply, Map.put(state, :needs_sync, true)}
  end

  def handle_info({:file_event, watcher_pid, :stop}, %{watcher_pid: watcher_pid} = state) do
    # YOUR OWN LOGIC WHEN MONITOR STOP
    IO.puts "Monitoring stoped"
    {:noreply, state}
  end

  def handle_info(:work, state) do
    if Map.get(state, :needs_sync) do
      copy_javascript()
    end

    # Reschedule once more
    schedule_work()

    {:noreply, Map.put(state, :needs_sync, false)}
  end

  defp copy_javascript() do
    IO.puts "Copying common javascript"
    files = File.ls!("./common")
    Enum.each(files, fn(file) ->
      cond do
        String.contains?(file, ".electron") ->
          filename = String.replace(file, ".electron", "")
          File.copy!("./common/#{file}", "../electron/src/common/#{filename}")
        String.contains?(file, ".native") ->
          filename = String.replace(file, ".native", "")
          File.copy!("./common/#{file}", "../native/common/#{filename}")
        true ->
          File.copy!("./common/#{file}", "../electron/src/common/#{file}")
          File.copy!("./common/#{file}", "../native/common/#{file}")
      end
    end)
  end


  defp schedule_work do
    # In 100 ms
    Process.send_after(self(), :work, 100)
  end
end
